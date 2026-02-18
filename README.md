# owsot
OWSOT- Overwatch Scoreboard Overlay Tool

! 자세한 내용은 노션을 참고해주세요 ! https://www.notion.so/Overwatch-Scoreboard-Overlay-Tool-OWSOT-2f4287940c8b809d8733e26a304677cf?source=copy_link
! Check Details from Notion ! https://www.notion.so/OWSOT-GUIDE-EN-30b287940c8b80fa8abecaaab77af5f1?source=copy_link

안녕하세요 Overwatch Scoreboard Ovelray Tool 통칭 OWSOT(옵솟) 제작자 납기라고 합니다. 오버워치 대회 UI 송출 프로그램을 완성하게 되어 배포하게 되었습니다. 옵솟은 다음과 같은 화면소스를 제공합니다: 대기, 중계, 로스터, 팀 인터뷰, 맵 픽 현황, 맵세트, 밴픽, 개요, HUD (총 11개).

구조를 간단히 설명하자면 프로그램 실행 시 나오는 '대시보드'에서 데이터를 넣은 후, 갱신 버튼을 눌러 적용하면 그에 맞게 화면이 송출됩니다. 

[대시보드 설명]
(상단에 나눠진 경기탭과 세부탭은 편리함을 위해 나눈거지 의미있진 않습니다.)
- 맵 유형은 기본과 호송으로 나눠져있으며 호위와 혼합 모드를 위한 설정을 하기 위해 쓰입니다.
- 각 팀 섹션별로 선택 팀, 스코어, 밴픽을 설정할 수 있고, 스코어에 경우 맵 세트 승자 결과를 보고 자동 조정 됩니다. (수동 조정 가능)
- 경기 정보 섹션 같은 경우엔 맵 이름, 선밴 팀(team 1 or team 2), 맵 #(순번), First To를 설정할 수 있고, 맵 순번도 자동 조정됩니다. (수동 조정 가능)
- 또한, 대시보드 내 값을 변경했을 경우, "항상 무조건" 정보 갱신 버튼을 눌러야 적용이 됩니다.
- 리셋 버튼들은 말그대로 각 섹션 또는 탭 별 리셋 버튼이고, 팀 위치 변경 (스왑 버튼)은 각 팀 섹션 별로 설정한 값을 말그대로 서로 뒤바꿀게 해줍니다.
- 오버뷰 이미지 같은 경우 개요 화면에서 이미지를 선택하고 적용 버튼을 누르면 개요 화면의 이미지가 변경됩니다.
- 대기시간 카운트다운은 대기화면 왼쪽 상단에 표시되는 카운트다운 숫자 값을 조정합니다. 시작 버튼을 누르면 시작이 되고, 중지 버튼 클릭 시 선택 시간에서 중지 되고, 리셋 버튼은 말그대로 아예 0분0초로 설정합니다.
- 맵 세트는 경기 마다 순번대로 세트를 추가 할 수 있으며 각각 1팀 밴픽, 2팀 밴픽, 맵, 맵 승자를 선택하여 각 경기 현황을 표시하는데에 쓰입니다.

더욱 자세한 설명은 노션을 참고 해주세요 (https://www.notion.so/Overwatch-Scoreboard-Overlay-Tool-OWSOT-2f4287940c8b809d8733e26a304677cf)

[UI 화면 송출하는법]
1. OBS 스튜디오 → 소스 추가 버튼 클릭 → 브라우저 → 확인 → URL 항목에 화면 소스 URL 첨부 → 너비 1920, 높이 1080 작성 → 확인
2. 구동기 OWSOT.exe 실행

[화면 소스 URL]
대기 - http://localhost:3000/waiting/index.html

기본 중계 화면 - http://localhost:3000/broadcast/index.html

1팀 로스터 - http://localhost:3000/team1Roster/index.html

2팀 로스터 - http://localhost:3000/team2Roster/index.html

1팀 인터뷰 - http://localhost:3000/team1_interview/index.html

2팀 인터뷰 - http://localhost:3000/team2_interview/index.html

맵픽 현황 - http://localhost:3000/mappoolpick/index.html

맵 세트 - http://localhost:3000/mapSets/index.html

밴픽 - http://localhost:3000/banpick/index.html

HUD - http://localhost:3000/index.html

개요 - http://localhost:3000/overview/index.html

자세한 사항은 디스코드 https://discord.com/users/437075261775675402 또는 napgi.daehwanggen@gmail.com으로 연락 바랍니다.
