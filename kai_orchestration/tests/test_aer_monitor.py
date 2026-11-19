"""Unit tests for kai_orchestration.aer_monitor.monitor_relay."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock, Mock, call, patch

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from kai_orchestration.aer_monitor import monitor_relay  # type: ignore[import-not-found]


def _make_mock_proc(
    *,
    poll_side_effect=None,
    poll_return_value=0,
    returncode: int = 0,
    stdout: str = "",
    stderr: str = "",
) -> MagicMock:
    proc = MagicMock()
    if poll_side_effect is not None:
        proc.poll.side_effect = poll_side_effect
    else:
        proc.poll.return_value = poll_return_value
    proc.returncode = returncode
    proc.communicate.return_value = (stdout, stderr)
    return proc


class TestMonitorRelay(unittest.TestCase):
    @patch("kai_orchestration.aer_monitor.time.sleep")
    @patch("kai_orchestration.aer_monitor.time.time", side_effect=[1000.0, 1000.0, 1015.4])
    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_workspace_paths", return_value=("/mnt/e/KhaiSpace", r"E:\KhaiSpace"))
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value="/fake/agy")
    def test_success_parses_json_and_invokes_heartbeat(
        self,
        _mock_bin: MagicMock,
        _mock_paths: MagicMock,
        mock_popen: MagicMock,
        _mock_time: MagicMock,
        mock_sleep: MagicMock,
    ) -> None:
        payload = {
            "status": "SUCCESS",
            "conversation_id": "conv-aer-123",
            "response": "Completed requested changes.",
        }
        mock_proc = _make_mock_proc(
            poll_side_effect=[None, None, 0],
            returncode=0,
            stdout=json.dumps(payload),
            stderr="",
        )
        mock_popen.return_value = mock_proc
        heartbeat = Mock()

        res = monitor_relay(
            "Add unit tests",
            "/mnt/e/KhaiSpace",
            timeout_seconds=120,
            heartbeat_seconds=15,
            heartbeat=heartbeat,
        )

        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["conversation_id"], "conv-aer-123")
        self.assertEqual(res["response"], "Completed requested changes.")
        self.assertIsNone(res["error"])

        heartbeat.assert_has_calls([call(0), call(15)])
        self.assertEqual(heartbeat.call_count, 2)
        mock_sleep.assert_has_calls([call(15), call(15)])

        mock_popen.assert_called_once()
        cmd = mock_popen.call_args.args[0]
        kwargs = mock_popen.call_args.kwargs
        self.assertEqual(cmd[0], "/fake/agy")
        self.assertIn("--output-format", cmd)
        self.assertEqual(cmd[cmd.index("--output-format") + 1], "json")
        self.assertIn("--mode", cmd)
        self.assertEqual(cmd[cmd.index("--mode") + 1], "accept-edits")
        self.assertIn("--dangerously-skip-permissions", cmd)
        self.assertEqual(cmd[cmd.index("--print-timeout") + 1], "120s")
        self.assertEqual(cmd[cmd.index("--add-dir") + 1], r"E:\KhaiSpace")
        self.assertNotIn("--conversation", cmd)
        self.assertTrue(cmd[-1].startswith("-p=Task: Add unit tests"))
        self.assertEqual(kwargs["cwd"], "/mnt/e/KhaiSpace")
        self.assertEqual(kwargs["stdin"], subprocess.DEVNULL)
        self.assertEqual(kwargs["stdout"], subprocess.PIPE)
        self.assertEqual(kwargs["stderr"], subprocess.PIPE)
        self.assertTrue(kwargs["text"])

    @patch("kai_orchestration.aer_monitor.time.sleep")
    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_workspace_paths", return_value=(r"E:\KhaiSpace", r"E:\KhaiSpace"))
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value=r"C:\agy\agy.exe")
    def test_nonzero_exit_code_returns_exit_status(
        self,
        _mock_bin: MagicMock,
        _mock_paths: MagicMock,
        mock_popen: MagicMock,
        _mock_sleep: MagicMock,
    ) -> None:
        mock_proc = _make_mock_proc(
            poll_return_value=2,
            returncode=2,
            stdout="",
            stderr="command failed with exit code 2",
        )
        mock_popen.return_value = mock_proc
        heartbeat = Mock()

        res = monitor_relay(
            "Run failing task",
            r"E:\KhaiSpace",
            conversation_id="conv-prev-9",
            heartbeat=heartbeat,
        )

        self.assertEqual(res["status"], "EXIT_2")
        self.assertEqual(res["conversation_id"], "conv-prev-9")
        self.assertEqual(res["response"], "")
        self.assertEqual(res["error"], "command failed with exit code 2")
        heartbeat.assert_not_called()

        cmd = mock_popen.call_args.args[0]
        self.assertIn("--conversation", cmd)
        self.assertEqual(cmd[cmd.index("--conversation") + 1], "conv-prev-9")

    @patch("kai_orchestration.aer_monitor.time.sleep")
    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_workspace_paths", return_value=(r"E:\KhaiSpace", r"E:\KhaiSpace"))
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value=r"C:\agy\agy.exe")
    def test_auth_failure_marker_returns_auth_failed(
        self,
        _mock_bin: MagicMock,
        _mock_paths: MagicMock,
        mock_popen: MagicMock,
        _mock_sleep: MagicMock,
    ) -> None:
        mock_proc = _make_mock_proc(
            poll_return_value=1,
            returncode=1,
            stdout="Authentication required. https://accounts.google.com/o/oauth2/auth?code_challenge=xyz",
            stderr="Print mode: silent auth failed",
        )
        mock_popen.return_value = mock_proc
        heartbeat = Mock()

        res = monitor_relay(
            "Protected task",
            r"E:\KhaiSpace",
            conversation_id="conv-auth",
            heartbeat=heartbeat,
        )

        self.assertEqual(res["status"], "AUTH_FAILED")
        self.assertEqual(res["conversation_id"], "conv-auth")
        self.assertEqual(res["response"], "")
        self.assertIsNotNone(res["error"])
        self.assertIn("authentication failed", res["error"].lower())
        self.assertNotIn("oauth2/auth", res["error"])
        heartbeat.assert_not_called()

    @patch("kai_orchestration.aer_monitor.time.sleep")
    @patch("kai_orchestration.aer_monitor.time.time", side_effect=[100.0, 120.0, 440.0])
    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_workspace_paths", return_value=(r"E:\KhaiSpace", r"E:\KhaiSpace"))
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value=r"C:\agy\agy.exe")
    def test_timeout_kills_process_and_returns_timeout(
        self,
        _mock_bin: MagicMock,
        _mock_paths: MagicMock,
        mock_popen: MagicMock,
        _mock_time: MagicMock,
        mock_sleep: MagicMock,
    ) -> None:
        mock_proc = _make_mock_proc(poll_side_effect=[None, None])
        mock_popen.return_value = mock_proc
        heartbeat = Mock()

        res = monitor_relay(
            "Long running task",
            r"E:\KhaiSpace",
            conversation_id="conv-slow",
            timeout_seconds=300,
            heartbeat_seconds=15,
            heartbeat=heartbeat,
        )

        self.assertEqual(res["status"], "TIMEOUT")
        self.assertEqual(res["conversation_id"], "conv-slow")
        self.assertEqual(res["response"], "")
        self.assertEqual(res["error"], "timed out")
        mock_proc.kill.assert_called_once()
        heartbeat.assert_has_calls([call(20), call(340)])
        mock_sleep.assert_called_once_with(15)

    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value=None)
    def test_missing_agy_binary_returns_error(
        self,
        _mock_bin: MagicMock,
        mock_popen: MagicMock,
    ) -> None:
        heartbeat = Mock()

        res = monitor_relay(
            "Any task",
            r"E:\KhaiSpace",
            conversation_id="conv-none",
            heartbeat=heartbeat,
        )

        self.assertEqual(res["status"], "ERROR")
        self.assertEqual(res["conversation_id"], "conv-none")
        self.assertEqual(res["response"], "")
        self.assertIn("not found", res["error"].lower())
        mock_popen.assert_not_called()
        heartbeat.assert_not_called()

    @patch("kai_orchestration.aer_monitor.time.sleep")
    @patch("kai_orchestration.aer_monitor.subprocess.Popen")
    @patch("kai_orchestration.aer_monitor.resolve_workspace_paths", return_value=(r"E:\KhaiSpace", r"E:\KhaiSpace"))
    @patch("kai_orchestration.aer_monitor.resolve_agy_binary", return_value=r"C:\agy\agy.exe")
    def test_plain_text_stdout_fallback_returns_success(
        self,
        _mock_bin: MagicMock,
        _mock_paths: MagicMock,
        mock_popen: MagicMock,
        _mock_sleep: MagicMock,
    ) -> None:
        mock_proc = _make_mock_proc(
            poll_return_value=0,
            returncode=0,
            stdout="  Plain text response from resumed turn  \n",
            stderr="",
        )
        mock_popen.return_value = mock_proc

        res = monitor_relay(
            "Follow up",
            r"E:\KhaiSpace",
            conversation_id="conv-resumed",
        )

        self.assertEqual(res["status"], "SUCCESS")
        self.assertEqual(res["conversation_id"], "conv-resumed")
        self.assertEqual(res["response"], "Plain text response from resumed turn")
        self.assertIsNone(res["error"])


if __name__ == "__main__":
    unittest.main()
