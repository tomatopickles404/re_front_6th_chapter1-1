# Cart Modal 트러블슈팅 가이드

작성일: 2025-01-22  
문제: 장바구니 모달 수량 버튼 미동작 및 E2E 테스트 실패

---

## 1. 문제 상황

### 1.1 증상

- 장바구니 모달 내 수량 증감 버튼이 간헐적으로 동작하지 않음
- E2E 테스트에서 `toMatchAriaSnapshot` 타임아웃 발생
- 선택 삭제 버튼이 존재하지 않아 테스트 실패

### 1.2 에러 메시지

```
Error: Timed out 5000ms waiting for expect(locator).toMatchAriaSnapshot(expected)

Locator: locator('#root')
- Expected  -   3
+ Received  + 130

- - text: /총 금액 670원/
- - button "전체 비우기"
- - button "구매하기"
+ - banner:
+   - heading "쇼핑몰" [level=1]:
+     - link "쇼핑몰":
+       - /url: /
+   - button "2":
+     - img
+     - text: "2"
+ - main:
+   - textbox "상품명을 검색해보세요..."
```

---

## 2. 근본 원인 분석

### 2.1 이벤트 위임 타겟 문제

**문제점:**

- 수량 증감 버튼 내부에 SVG 아이콘이 중첩되어 있음
- 클릭 시 `e.target`이 실제 버튼이 아닌 내부 SVG 요소를 가리킴
- SVG 요소에는 `data-product-id` 속성이 없어 `productId`가 `undefined`가 됨

**HTML 구조:**

```html
<button class="quantity-increase-btn" data-product-id="123">
  <svg>...</svg>
  <!-- 실제 클릭되는 요소 -->
</button>
```

**기존 문제 코드:**

```javascript
addEvent("click", ".quantity-increase-btn", (e) => {
  const productId = e.target.dataset.productId; // SVG에서 읽으려 해서 undefined
  // ...
});
```

### 2.2 스냅샷 대상 선택 문제

**문제점:**

- 모달이 `#root` 외부에 렌더됨
- `openCartModal()`이 `document.body` 하위에 `#cart-modal-container`를 생성
- `.cart-modal`이 `#root` 밖에 존재하여 스냅샷 비교 시 모달 내용이 포함되지 않음

**DOM 구조:**

```
document.body
├── #root (앱 메인 컨텐츠)
│   ├── header
│   └── main
└── #cart-modal-container (모달 컨테이너)
    └── .cart-modal (실제 모달)
```

### 2.3 선택 삭제 기능 부재

**문제점:**

- E2E 테스트에서 `#cart-modal-remove-selected-btn` 클릭 시도
- 해당 버튼이 UI에 존재하지 않음
- 관련 이벤트 핸들러도 구현되지 않음

---

## 3. 해결 과정

### 3.1 이벤트 핸들러 수정

**파일:** `src/services/eventService.js`

**수정 전:**

```javascript
addEvent("click", ".quantity-increase-btn", (e) => {
  const productId = e.target.dataset.productId; // 문제: SVG에서 읽음
  // ...
});
```

**수정 후:**

```javascript
addEvent("click", ".quantity-increase-btn", (e) => {
  const button = e.target.closest(".quantity-increase-btn");
  const productId = button?.dataset.productId; // 해결: 실제 버튼에서 읽음
  // ...
});
```

**핵심:** `e.target.closest()`를 사용하여 실제 버튼 요소를 확보

### 3.2 E2E 테스트 수정

**파일:** `e2e/e2e-hard.spec.js`

**수정 전:**

```javascript
await expect(page.locator("#root")).toMatchAriaSnapshot(`
  - text: /총 금액 670원/
  - button "전체 비우기"
  - button "구매하기"
`);
```

**수정 후:**

```javascript
await expect(page.locator(".cart-modal")).toBeVisible();
await expect(page.locator(".cart-modal")).toMatchAriaSnapshot(`
  - text: /총 금액 670원/
  - button "전체 비우기"
  - button "구매하기"
`);
```

**핵심:** 스냅샷 대상을 `#root`에서 `.cart-modal`로 변경

### 3.3 선택 삭제 기능 구현

**UI 추가 (`CartModal.js`):**

```html
<button
  id="cart-modal-remove-selected-btn"
  class="flex-1 bg-red-600 text-white py-2 px-4 rounded-md 
         hover:bg-red-700 transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
  disabled
>
  선택 삭제
</button>
```

**이벤트 핸들러 추가 (`eventService.js`):**

```javascript
// 선택 삭제 버튼
addEvent("click", "#cart-modal-remove-selected-btn", () => {
  const checkedBoxes = document.querySelectorAll(".cart-item-checkbox:checked");
  checkedBoxes.forEach((checkbox) => {
    const productId = checkbox.dataset.productId;
    cartStore.removeFromCart(productId);
  });
  refreshCartModal();
});

// 버튼 상태 업데이트 헬퍼 함수
function updateRemoveSelectedButton() {
  const checkedBoxes = document.querySelectorAll(".cart-item-checkbox:checked");
  const removeSelectedBtn = document.querySelector("#cart-modal-remove-selected-btn");

  if (removeSelectedBtn) {
    removeSelectedBtn.disabled = checkedBoxes.length === 0;
  }
}
```

---

## 4. 포털과 유사한 렌더링 구조

### 4.1 React Portal과의 유사점

**React Portal:**

```jsx
ReactDOM.createPortal(<Modal />, document.body);
```

**현재 구현:**

```javascript
function openCartModal() {
  const modalContainer = document.createElement("div");
  modalContainer.id = "cart-modal-container";
  document.body.appendChild(modalContainer); // #root 외부에 렌더
  renderCartModal();
}
```

### 4.2 테스트 시 주의사항

- **올바른 방법:** 모달 컨테이너를 대상으로 검증
- **잘못된 방법:** `#root`를 대상으로 검증 (모달이 포함되지 않음)

---

## 5. 검증 결과

### 5.1 수량 버튼 동작

- ✅ 버튼 클릭 시 수량 정상 증감
- ✅ SVG 아이콘 클릭 시에도 정상 동작
- ✅ `data-product-id` 속성 정확히 읽어옴

### 5.2 E2E 테스트

- ✅ 스냅샷 타임아웃 해소
- ✅ 모달 내용 정확히 검증
- ✅ 선택 삭제 기능 정상 동작

### 5.3 사용자 경험

- ✅ 선택된 항목이 없을 때 삭제 버튼 비활성화
- ✅ 선택된 항목이 있을 때 삭제 버튼 활성화
- ✅ 체크박스 상태 변경 시 버튼 상태 실시간 업데이트

---

## 6. 재발 방지 체크리스트

### 6.1 이벤트 위임 관련

- [ ] `e.target` 사용 시 `closest()`로 의도된 요소 확보
- [ ] 중첩된 요소가 있는 버튼은 이벤트 위임 주의
- [ ] `data-*` 속성은 실제 이벤트 타겟이 아닌 컨테이너에서 읽기

### 6.2 포털/외부 렌더링 관련

- [ ] 루트 외부에 렌더되는 UI는 해당 컨테이너를 대상으로 테스트
- [ ] 스냅샷 테스트 시 올바른 DOM 범위 선택
- [ ] 모달/팝업 등은 별도 컨테이너 기준으로 검증

### 6.3 E2E 테스트 관련

- [ ] 상호작용 전/후 상태를 명확히 검증 (초기값 → 액션 → 결과값)
- [ ] 존재하지 않는 요소에 대한 클릭 시도 방지
- [ ] 비동기 렌더링 대기 시간 고려

---

## 7. 참고 파일

- `src/components/CartModal.js` - 모달 UI 및 렌더링 로직
- `src/services/eventService.js` - 이벤트 핸들러 및 상태 관리
- `e2e/e2e-hard.spec.js` - E2E 테스트 케이스
- `src/utils/event.js` - 이벤트 위임 유틸리티

---

## 8. 학습 포인트

1. **이벤트 위임의 함정**: 중첩된 요소에서 `e.target` 사용 시 주의
2. **DOM 구조 이해**: 포털과 유사한 외부 렌더링의 테스트 방법
3. **점진적 기능 구현**: 테스트 실패 → 원인 분석 → 단계별 수정
4. **사용자 경험 고려**: 버튼 상태 관리 및 피드백 제공

---

_이 문서는 실제 트러블슈팅 과정을 바탕으로 작성되었으며, 향후 유사한 문제 해결에 참고할 수 있습니다._
