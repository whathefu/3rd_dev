







#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
원격(본인 PC) DB를 기준으로 로컬(실행자 PC) DB를 '파괴적으로' 덮어쓰기(sync-to-source) 합니다.
- mariadb-dump/mariadb (또는 mysqldump/mysql) CLI 필요
- 동작: 원격 덤프 → 로컬에 DROP DATABASE/CREATE DATABASE 포함 상태로 복원 (트리거/루틴/이벤트 포함)
- 주의: 로컬 DB는 원격과 동일해지고, 로컬의 사용자 데이터는 보존되지 않습니다.

예시:
    python sync_ai_go_force_overwrite.py
    python sync_ai_go_force_overwrite.py --pre-backup-local
    python sync_ai_go_force_overwrite.py --remote-host 192.168.0.23 --remote-user ai_go_team --remote-pass 20250913
"""

import argparse
import shutil
import subprocess
import sys
import shlex
import getpass
from datetime import datetime
from pathlib import Path

# ===== 기본값(기존 sync_ai_go.py와 동일한 정신) =====
DEFAULT_REMOTE = {
    "host": "192.168.101.204",   # 수정X : 학원 Wi-Fi IPv4 주소(같은 네트워크에서만 접근 가능)
    "port": 3306,
    "user": "ai_go_team",
    "password": "20250913",
    "database": "ai_go",
}

DEFAULT_LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password",  # 각자 로컬 root 비번으로 바꿔서 사용 권장
    "database": "ai_go",
}

# ===== 덤프/복원 옵션 (스키마+데이터+객체 전부) =====
DUMP_COMMON_OPTS = [
    "--add-drop-database",     # 복원 시 동일 DB가 있으면 DROP 후 CREATE
    "--triggers",
    "--routines",
    "--events",
    "--single-transaction",    # InnoDB 스냅샷
    "--set-gtid-purged=OFF",   # MariaDB/MySQL 혼용시 GTID 관련 충돌 방지
]

def which_first(*candidates):
    """시스템에 설치된 바이너리 중 첫 번째로 발견된 것을 반환."""
    for c in candidates:
        if shutil.which(c):
            return c
    return None

def run_shell(cmd: str) -> None:
    print(f"[RUN] {cmd}")
    p = subprocess.Popen(cmd, shell=True)
    p.wait()
    if p.returncode != 0:
        sys.exit(p.returncode)

def quote_pw_inline(pw: str) -> str:
    """
    파이프 라인에서 비번 프롬프트를 피하기 위해 -p'비번' 형식을 씁니다.
    (주의: 프로세스 목록에 노출될 수 있음. 안전이 중요하면 --ask-remote-pass / --ask-local-pass 사용)
    """
    return shlex.quote(pw)

def backup_local_db(args, dump_bin: str, out_dir: Path) -> Path:
    """로컬 DB를 백업(덤프)합니다."""
    out_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out_file = out_dir / f"{args.local_db}_local_backup_{ts}.sql"

    pw = args.local_pass or ""
    cmd = (
        f"{dump_bin} "
        f"-h {shlex.quote(args.local_host)} -P {shlex.quote(str(args.local_port))} "
        f"-u {shlex.quote(args.local_user)} -p{quote_pw_inline(pw)} "
        f"--databases {shlex.quote(args.local_db)} "
        + " ".join(DUMP_COMMON_OPTS) +
        f" > {shlex.quote(str(out_file))}"
    )
    run_shell(cmd)
    print(f"[BACKUP] 로컬 DB 백업 완료 → {out_file}")
    return out_file

def main():
    parser = argparse.ArgumentParser(
        description="원격 DB → 로컬 DB 파괴적 덮어쓰기(드롭/복원) 동기화 스크립트"
    )

    # 원격(= 소스)
    parser.add_argument("--remote-host", default=DEFAULT_REMOTE["host"])
    parser.add_argument("--remote-port", type=int, default=DEFAULT_REMOTE["port"])
    parser.add_argument("--remote-user", default=DEFAULT_REMOTE["user"])
    parser.add_argument("--remote-pass", default=DEFAULT_REMOTE["password"])
    parser.add_argument("--remote-db",   default=DEFAULT_REMOTE["database"])

    # 로컬(= 타겟)
    parser.add_argument("--local-host", default=DEFAULT_LOCAL["host"])
    parser.add_argument("--local-port", type=int, default=DEFAULT_LOCAL["port"])
    parser.add_argument("--local-user", default=DEFAULT_LOCAL["user"])
    parser.add_argument("--local-pass", default=DEFAULT_LOCAL["password"])
    parser.add_argument("--local-db",   default=DEFAULT_LOCAL["database"])

    # 선택 옵션
    parser.add_argument("--ask-remote-pass", action="store_true", help="원격 비밀번호를 프롬프트로 안전 입력")
    parser.add_argument("--ask-local-pass",  action="store_true", help="로컬 비밀번호를 프롬프트로 안전 입력")
    parser.add_argument("--pre-backup-local", action="store_true", help="덮어쓰기 전 로컬 DB를 백업(sql 덤프)")

    parser.add_argument("--backup-dir", default="./db_backups", help="로컬 백업 저장 폴더")
    args = parser.parse_args()

    # 비밀번호 프롬프트 (선택)
    if args.ask_remote_pass:
        args.remote_pass = getpass.getpass("Remote DB password: ")
    if args.ask_local_pass:
        args.local_pass = getpass.getpass("Local DB password: ")

    # 사용 가능한 도구 확인
    dump_bin = which_first("mariadb-dump", "mysqldump")
    cli_bin  = which_first("mariadb", "mysql")
    if not dump_bin or not cli_bin:
        print("[ERROR] mariadb-dump/mysqldump 또는 mariadb/mysql 클라이언트를 설치/경로등록 하세요.")
        sys.exit(1)

    # 🔥 정말 덮어쓸지 확인
    print("⚠️  이 작업은 로컬 DB를 원격 DB 상태로 **완전히 덮어쓰기** 합니다.")
    print(f"    대상 로컬: {args.local_user}@{args.local_host}:{args.local_port}/{args.local_db}")
    ok = input("계속하시겠습니까? (yes/NO): ").strip().lower()
    if ok != "yes":
        print("취소했습니다.")
        return

    # (선택) 로컬 선백업
    if args.pre_backup_local:
        backup_local_db(args, dump_bin, Path(args.backup_dir))

    # 원격 → 로컬 파이프 복원
    remote_pw = args.remote_pass or ""
    local_pw  = args.local_pass  or ""

    dump_opts = " ".join(DUMP_COMMON_OPTS)

    dump_cmd = (
        f"{dump_bin} "
        f"-h {shlex.quote(args.remote_host)} -P {shlex.quote(str(args.remote_port))} "
        f"-u {shlex.quote(args.remote_user)} -p{quote_pw_inline(remote_pw)} "
        f"--databases {shlex.quote(args.remote_db)} "
        f"{dump_opts}"
    )

    restore_cmd = (
        f"{cli_bin} "
        f"-h {shlex.quote(args.local_host)} -P {shlex.quote(str(args.local_port))} "
        f"-u {shlex.quote(args.local_user)} -p{quote_pw_inline(local_pw)}"
    )

    full_cmd = f"{dump_cmd} | {restore_cmd}"
    run_shell(full_cmd)

    print("\n✅ 완료: 로컬 DB가 원격 DB와 동일하게 덮어쓰기 되었습니다.")
    print("   (트리거/프로시저/이벤트 포함, 기존 로컬 데이터는 모두 대체됨)")

if __name__ == "__main__":
    main()
