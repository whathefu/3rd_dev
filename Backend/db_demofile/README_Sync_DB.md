# mariaDB 연동 최초 1회만 실행

1) 라이브러리 설치 - 각자 가상환경에 맞게 알아서

```bash
uv pip install -r requirements_Database.txt
# 또는
pip install -r requirements_Database.txt
```


2) 실행 (예시)

1. `Database_ai_go.sql` 문 전체 실행

2. `sync_ai_go.py` 파일에 password 본인 root 계정 비번으로 바꾸기

```python

# 파일에서 아래 코드만 수정. 다른 것은 수정 x

DEFAULT_LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "1234", # <!> 이 부분만 본인 root 계정 비번으로 바꾸기 <!>
    "database": "ai_go",
}

```


2. Gitbash 에서 아래 명령문 실행

```bash
set REMOTE_HOST=192.168.101.204
python sync_ai_go.py
# 비번은 본인 root 계정 비밀번호
```

------------------------------------------------------------------------------------


# DB 업데이트하기(동기화)

1. `sync_ai_go_force_overwrite.py` 파일에 password 본인 root 계정 비번으로 바꾸기

```python

# 파일에서 아래 코드만 수정. 다른 것은 수정 x

DEFAULT_LOCAL = {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "password", # <!> 이 부분만 본인 root 계정 비번으로 바꾸기 <!>
    "database": "ai_go",
}

```


2. 기본 실행
```bash
# 기본 실행 (기본값 remote/local 설정 사용)
python sync_ai_go_force_overwrite.py






# 현재 내 로컬 DB를 백업하고 싶다면?

# 실행 전 로컬 DB 백업도 같이 남기기
python sync_ai_go_force_overwrite.py --pre-backup-local
```
