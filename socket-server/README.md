# Shared Alarm Socket.IO 서버

이 서버는 Shared Alarm 애플리케이션의 실시간 통신을 위한 Socket.IO 서버입니다.

## 기능

- 실시간 방 생성 및 참가
- 실시간 알람 동기화
- 사용자 접속 및 연결 해제 이벤트 처리

## 개발 환경 설정

```bash
# 의존성 설치
bun i

# 개발 서버 실행
bun dev
```

## 배포 방법 (Render)

1. Render 계정에 로그인합니다.
2. "New Web Service" 버튼을 클릭합니다.
3. GitHub 저장소에 연결합니다.
4. 다음 설정을 구성합니다:
   - Name: shared-alarm-socket (원하는 이름으로 변경 가능)
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Auto-Deploy: On (기본값)

## 환경 변수

- `PORT`: 서버가 리스닝할 포트 (기본값: 4000)

## API 엔드포인트

- `GET /`: 서버 상태 확인
- `GET /health`: 헬스 체크용 엔드포인트

## Socket.IO 이벤트

### 클라이언트에서 서버로

- `create-room`: 새 방 생성
- `join-room`: 기존 방 참가
- `add-alarm`: 알람 추가
- `delete-alarm`: 알람 삭제

### 서버에서 클라이언트로

- `room-created`: 방 생성 완료
- `room-joined`: 방 참가 완료
- `user-joined`: 다른 사용자가 방에 참가함
- `user-left`: 사용자가 방을 나감
- `alarm-added`: 알람이 추가됨
- `alarm-deleted`: 알람이 삭제됨
- `error`: 오류 발생
