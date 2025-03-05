# Shared Alarm Timer

공유 알람 타이머 웹 애플리케이션은 최대 5명의 사용자가 로그인 없이 온라인으로 알람을 공유할 수 있는 서비스입니다.

## 주요 기능

- 로그인 없이 사용 가능
- 방 생성 및 참여 (최대 5명)
- 알람 타이머 등록/공유
- 알람 발생 시 소리 알림
- 실시간 공유 (다른 사용자가 추가한 알람 즉시 확인 가능)

## 기술 스택

- Next.js
- React
- Socket.IO (실시간 통신)
- CSS (반응형 디자인)

## 설치 및 실행 방법

1. 프로젝트 클론:
```bash
git clone [repository-url]
cd shared-alarm
```

2. 의존성 설치:
```bash
npm install
```

3. 알람 소리 파일 추가:
   - `/public/alarm-sound.mp3` 파일을 추가해야 합니다
   - 무료 알람 소리는 다음에서 구할 수 있습니다:
     - https://pixabay.com/sound-effects/search/alarm/
     - https://freesound.org/search/?q=alarm

4. 개발 서버 실행:
```bash
npm run dev
```

5. 웹 브라우저에서 `http://localhost:3000` 접속

## 사용 방법

1. 홈페이지에서 "Create New Room" 버튼을 클릭하여 새 방 생성
2. 또는 기존 방 ID를 입력하여 방에 참여
3. 방에 입장한 후 하단의 폼을 통해 알람 추가:
   - 알람 이름 입력
   - 날짜와 시간 선택
   - "Add Alarm" 버튼 클릭
4. 알람이 울릴 때 "Stop Alarm" 버튼을 클릭하여 알람 중지
5. "Share Room Link" 버튼을 클릭하여 다른 사용자와 방 링크 공유 (최대 5명)

## 참고사항

- 모든 알람은 서버 메모리에 저장되므로 서버 재시작 시 사라집니다
- 모든 사용자가 방을 나가면 방은 자동으로 삭제됩니다
- 호환성을 위해 최신 웹 브라우저 사용을 권장합니다