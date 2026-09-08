<!--
  프로필 README  ·  저택 서재
  assets/scene.svg     : 배경 전체 장면 (벽 + 책장 + 책 + 바 카운터 + 캐릭터 자리)
  assets/books.svg     : "책" 클릭용 썸네일
  캐릭터 그림이 나오면 scene.svg 의 character slot 자리에 삽입하고,
  맨 아래 CHARACTER 주석 블록을 풀어 두 칸 표로 바꾸면 됨.
  지글거림(WigglyPaint 스타일)은 SVG 안에서 재생됨. JS 없음.
  언어 블록은 KO / EN 주석으로 구분 — 나중에 영어 추가 대비.
-->

<div align="center">
  <img src="assets/scene.svg" width="880"
       alt="어둑한 고딕 저택 서재의 벽 — 앤틱 회중시계, 벽 촛대, 액자, 붙박이 책장의 책 더미, 그리고 전경의 긴 바 카운터" />
</div>

<!-- KO -->
<h2 align="center">늦은 밤의 서재 &nbsp;·&nbsp; the late study</h2>
<p align="center"><i>벽난로는 등 뒤에 있습니다. 촛불 하나로 충분한 밤.</i></p>

<div align="center">

<details>
  <summary><img src="assets/books.svg" width="360" alt="책장의 책 한 줄 — 눌러서 펼치기" /></summary>
  <div align="left">

  <br />

  **📚 책장에서 / on the shelf**

  - 요즘 읽는 책 — *제목*
  - 다시 꺼내보는 책 — *제목*
  - 추천 — [링크](https://example.com)

  </div>
</details>

</div>

<!-- CHARACTER : 캐릭터 그림 완성되면 이 블록을 풀어 위 책 카드와 나란히 두 칸 표로 배치
<div align="center">
<table><tr>
<td><details><summary><img src="assets/books.svg" width="340" /></summary> ... </details></td>
<td><details><summary><img src="assets/character.svg" width="340" /></summary>
  <div align="left">

  🕯️ 서재 주인 / behind the bar

  - 이름 · 한 줄 소개
  - 쓰는 것 · 언어 / 툴
  - 연락 · 이메일

  </div>
</details></td>
</tr></table>
</div>
-->

<p align="center"><sub>SVG 손그림이 WigglyPaint처럼 계속 꿈틀댑니다 · 클릭 상호작용은 위 책 카드의 펼치기</sub></p>
