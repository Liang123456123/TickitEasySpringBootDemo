$(document).ready(function () {
    loadProductDetail();
    loadRecommendProducts();  // 加載推薦商品
    // 點擊主圖放大（#mainImage 點擊觸發 Bootstrap Modal）
    $(document).on('click', '#mainImage', function() {
        const imageUrl = $(this).attr('src');
        const modalHtml = `
            <div class="modal fade" id="imageModal" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered modal-lg ">
                    <div class="modal-content">
                        <div class="modal-header border-0" >
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body text-center">
                            <img src="${imageUrl}" class="img-fluid" alt="放大圖片">
                        </div>
                    </div>
                </div>
            </div>
        `;
        $('body').append(modalHtml);
        $('#imageModal').modal('show');
        $('#imageModal').on('hidden.bs.modal', function () {
            $(this).remove();
        });
    });
});


function loadProductDetail() {
    axios.get(`/TickitEasy/user/api/product/${productID}`)
        .then(response => {
            const product = response.data;
            renderProductDetail(product);
        })
        .catch(error => {
            console.error('Error loading product details:', error);
            document.getElementById('productDetail').innerHTML = '<p class="text-danger">商品加載失敗，請稍後再試。</p>';
        });
}

function renderProductDetail(product) {
    const template = document.getElementById('productDetailTemplate').content.cloneNode(true);

    // 設定主圖
    const mainImage = template.getElementById('mainImage');
    mainImage.src = `/TickitEasy${product.productPic}`;
    mainImage.alt = product.productName;

    // 設定縮略圖
    const thumbnailsContainer = template.getElementById('thumbnails');
    const mainThumbnail = document.createElement('img');
    mainThumbnail.src = `/TickitEasy${product.productPic}`;
    mainThumbnail.alt = product.productName;
    mainThumbnail.classList.add('thumbnail-image');
    mainThumbnail.onclick = () => changeMainImage(mainThumbnail.src);
    thumbnailsContainer.appendChild(mainThumbnail);

    // 新增其他副圖
    product.detailPhotos.forEach(photo => {
        const img = document.createElement('img');
        img.src = `/TickitEasy${photo}`;
        img.alt = product.productName;
        img.classList.add('thumbnail-image');
        img.onclick = () => changeMainImage(img.src);
        thumbnailsContainer.appendChild(img);
    });

    // 設定商品資料
    template.getElementById('productName').textContent = product.productName;
    template.getElementById('productPrice').textContent = product.price;
    template.getElementById('productStock').textContent = product.stock;
    template.getElementById('productDesc').textContent = product.productDesc;

    // 顯示相應的按鈕
    if (product.status === 2) {
        template.getElementById('notificationButtonContainer').style.display = 'block'; // 顯示補貨通知按鈕
		template.getElementById('cartButtonsContainer').style.display = 'none';         // 隱藏購物車按鈕
		template.getElementById('productStocknone').style.display = 'none';         // 隱藏庫存
		template.getElementById('quantityInputnone').style.display = 'none';         // 隱藏數量輸入框
    } else {
		template.getElementById('notificationButtonContainer').style.display = 'none';  // 隱藏補貨通知按鈕
        template.getElementById('cartButtonsContainer').style.display = 'block';			// 顯示購物車按鈕
		   }
    

    document.getElementById('productDetail').appendChild(template);
}

function changeMainImage(src) {
    document.getElementById('mainImage').src = src;
}

// 推薦商品載入
function loadRecommendProducts() {
    axios.get(`/TickitEasy/user/api/product/${productID}/recommend`)
        .then(response => {
            const products = response.data;
            const container = document.getElementById('recommendedProductsContainer');
            container.innerHTML = '';  // 清空現有內容

            if (!products || products.length === 0) {
                container.innerHTML = '<div class="col-12 text-center">暫無推薦商品</div>';
                return;
            }

            products.forEach(product => {
                const template = document.getElementById('recommendedProductTemplate').content.cloneNode(true);
                template.querySelector('.recommended-img').src = `/TickitEasy${product.productPic}`;
                template.querySelector('.recommended-img').alt = product.productName;
                template.querySelector('.recommended-name').textContent = product.productName;
                template.querySelector('.recommended-price').textContent = product.price;
                template.querySelector('a').href = `/TickitEasy/product/${product.productID}`;
                container.appendChild(template);
            });
        })
        .catch(error => {
            console.error('Error loading recommended products:', error);
            document.getElementById('recommendedProductsContainer').innerHTML = '<div class="col-12 text-center text-danger">載入推薦商品時發生錯誤</div>';
        });
}

// 增加商品數量
function increaseQuantity() {
    const quantityInput = document.getElementById('quantityInput');
    let quantity = parseInt(quantityInput.value, 10);
    quantityInput.value = quantity + 1;
}

// 減少商品數量
function decreaseQuantity() {
    const quantityInput = document.getElementById('quantityInput');
    let quantity = parseInt(quantityInput.value, 10);
    if (quantity > 1) {
        quantityInput.value = quantity - 1;
    }
}

// 修改商品數量
function updateQuantity(value) {
    const quantityInput = document.getElementById('quantityInput');
    if (value < 1) {
        quantityInput.value = 1;
    }
}

// 補貨通知
function setNotification() {
    axios.post(`/TickitEasy/user/api/product/notify/${productID}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` }
    })
	.then(response => {
		        // 使用 SweetAlert2 顯示提示訊息
		        Swal.fire({
		            position: 'center',
		            icon: "success",
		            title: response.data.message || "設定補貨通知",
		            showConfirmButton: false,
		            timer: 1500
		        });
		    })
		    .catch(error => {
		        if (error.response && error.response.status === 401) {
		            Swal.fire({
		                position: 'center',
		                icon: 'warning',
		                title: '請先登入會員',
		                showConfirmButton: false,
		                timer: 1500
		            });
		            window.location.href = '/TickitEasy/login';
		        } else {
		            Swal.fire({
		                position: 'center',
		                icon: 'error',
		                title: '操作失敗，請稍後再試',
		                showConfirmButton: false,
		                timer: 1500
		            });
		        }
		    });
}

// 加入購物車

function addToCart(buyNow) {
    const quantity = parseInt(document.getElementById('quantityInput').value, 10);
    if (isNaN(quantity) || quantity < 1) {
        alert('請輸入大於0的數量');
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // 檢查購物車中是否已存在該商品
    const existingItemIndex = cart.findIndex(item => item.productID === productID);

    if (existingItemIndex > -1) {
        // 更新商品數量
        cart[existingItemIndex].quantity += quantity;
    } else {
        // **存完整商品資訊，讓購物車頁面可以讀取**
        const cartItem = {
            productID: productID,
            productName: document.getElementById("productName").innerText, 
            productPic: document.getElementById("mainImage").src, 
            price: parseFloat(document.getElementById("productPrice").innerText),
            quantity: quantity
        };
        cart.push(cartItem);
    }

    // 更新 localStorage
    localStorage.setItem('cart', JSON.stringify(cart));

    // 判斷是跳轉到購物車頁面還是顯示提示訊息
    if (buyNow) {
        window.location.href = '/TickitEasy/user/cart';
    } else {
        Swal.fire({
            position: 'center',
            icon: 'success',
            title: '商品已加入購物車',
            showConfirmButton: false,
            timer: 1500  
        });
    }
}

// 收藏功能
function toggleFavorite() {
	
	const jwtToken = localStorage.getItem('jwtToken');

	    // 如果使用者沒有登入，直接跳轉到登入頁面
	    if (!jwtToken) {
	        window.location.href = '/TickitEasy/login';
	        return;  // 直接 return，不要發送請求
	    }
	
    axios.post(`/TickitEasy/user/api/product/favorite/${productID}`, {}, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('jwtToken')}` }
    })
	.then(response => {
			
		// 從後端獲取收藏狀態並更新按鈕
		       const favoriteButton = document.getElementById('favoriteButton');
		       const message = response.data.message;

		       if (message.includes("取消收藏")) {
		           favoriteButton.innerHTML = '<i class="fas fa-heart"></i> 加入收藏';
				   favoriteButton.classList.remove('favorited');  // 切換為白色按鈕
		       } else {
		           favoriteButton.innerHTML = '<i class="fas fa-heart"></i> 取消收藏';
				   favoriteButton.classList.add('favorited');    // 切換為紅色按鈕
		       }	
		
	        // 使用 SweetAlert2 顯示提示訊息
	        Swal.fire({
	            position: 'center',
	            icon: "success",
	            title: response.data.message || "商品加入收藏",
	            showConfirmButton: false,
	            timer: 1500
	        });
	    })
	    .catch(error => {
	        if (error.response && error.response.status === 401) {
	            Swal.fire({
	                position: 'center',
	                icon: 'warning',
	                title: '請先登入會員',
	                showConfirmButton: false,
	                timer: 1500
	            });
	            window.location.href = '/TickitEasy/login';
	        } else {
	            Swal.fire({
	                position: 'center',
	                icon: 'error',
	                title: '操作失敗，請稍後再試',
	                showConfirmButton: false,
	                timer: 1500
	            });
	        }
	    });
	}
