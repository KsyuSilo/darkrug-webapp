class DarKrugApp {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('dakrug_items')) || this.generateSampleItems();
        this.users = JSON.parse(localStorage.getItem('dakrug_users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('dakrug_currentUser')) || null;
        this.currentCity = localStorage.getItem('dakrug_city') || 'Москва';
        this.currentPage = 1;
        this.itemsPerPage = 6;
        this.currentFilter = 'all';
        this.currentSearch = '';
        this.showingMyItems = false;
        this.uploadedImages = [];
        this.sliderStates = {};
        this.modalSliderState = {};
        this.init();
    }

    generateSampleItems() {
        return [
            { id: Date.now()+1, title: 'Кухонный стул', desc: 'Деревянный стул в отличном состоянии. Район Марьино.', category: 'home', city: 'Москва', images: ['🪑'], phone: '+79001234567', seller: 'Анна' },
            { id: Date.now()+2, title: 'Детские игрушки', desc: 'Набор конструктора + мягкие игрушки. Все чистое.', category: 'kids', city: 'Москва', images: ['🧸'], phone: '+79007654321', seller: 'Мария' },
            { id: Date.now()+3, title: 'Книги по Java', desc: 'Head First Java, Effective Java. Отличное состояние.', category: 'books', city: 'Москва', images: ['📚'], phone: '+79111234567', seller: 'Ксения' },
            { id: Date.now()+4, title: 'Горшок для цветов', desc: 'Керамический, новый.', category: 'home', city: 'Санкт-Петербург', images: ['🌿'], phone: '+79221234567', seller: 'Ольга' },
            { id: Date.now()+5, title: 'Футбольный мяч', desc: 'Размер 5, почти новый.', category: 'sport', city: 'Москва', images: ['⚽'], phone: '+79331234567', seller: 'Дмитрий' }
        ];
    }

    saveData() { 
        localStorage.setItem('dakrug_items', JSON.stringify(this.items)); 
        localStorage.setItem('dakrug_users', JSON.stringify(this.users)); 
        localStorage.setItem('dakrug_currentUser', JSON.stringify(this.currentUser)); 
        localStorage.setItem('dakrug_city', this.currentCity); 
    }

    init() {
        this.bindEvents();
        this.renderFeed();
        this.updateProfileUI();
        this.loadTheme();
        if (this.currentUser) document.getElementById('profileName').innerText = this.currentUser.name;
        else document.getElementById('profileName').innerText = 'Гость';
        
        document.querySelectorAll('#formFilters .filter-pill').forEach(pill => {
            pill.classList.remove('active');
            if(pill.dataset.category === 'home') pill.classList.add('active');
        });
    }

    bindEvents() {
        document.getElementById('homeBtn').onclick = () => { this.showingMyItems = false; this.showScreen('feed'); };
        document.getElementById('addBtn').onclick = () => { this.showScreen('create'); this.uploadedImages = []; this.updatePhotoPreview(); };
        document.getElementById('profileBtn').onclick = () => this.toggleProfile();
        document.getElementById('profileClose').onclick = () => this.toggleProfile();
        document.getElementById('profileOverlay').onclick = (e) => { if(e.target.id === 'profileOverlay') this.toggleProfile(); };
        document.getElementById('searchInput').oninput = (e) => { this.currentSearch = e.target.value; document.getElementById('searchClear').style.display = this.currentSearch ? 'block' : 'none'; this.currentPage=1; this.renderFeed(); };
        document.getElementById('searchClear').onclick = () => { document.getElementById('searchInput').value = ''; this.currentSearch = ''; document.getElementById('searchClear').style.display = 'none'; this.currentPage=1; this.renderFeed(); };
        
        document.querySelectorAll('#mainFilters .filter-pill').forEach(p => {
            p.onclick = () => { 
                document.querySelectorAll('#mainFilters .filter-pill').forEach(f=>f.classList.remove('active')); 
                p.classList.add('active'); 
                this.currentFilter = p.dataset.category; 
                this.currentPage=1; 
                this.renderFeed(); 
            };
        });
        
        document.getElementById('prevPage').onclick = () => { if(this.currentPage>1){ this.currentPage--; this.renderFeed(); } };
        document.getElementById('nextPage').onclick = () => { const total=Math.ceil(this.getFilteredItems().length/this.itemsPerPage); if(this.currentPage<total){ this.currentPage++; this.renderFeed(); } };
        document.getElementById('photoUpload').onclick = () => {
            if(this.uploadedImages.length < 5) {
                document.getElementById('photoInput').click();
            } else {
                this.showNotification('Максимум 5 фото', true);
            }
        };
        document.getElementById('photoInput').onchange = (e) => {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                if(this.uploadedImages.length >= 5) {
                    this.showNotification('Максимум 5 фото', true);
                    return;
                }
                if(file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        this.uploadedImages.push(ev.target.result);
                        this.updatePhotoPreview();
                    };
                    reader.readAsDataURL(file);
                }
            });
            e.target.value = '';
        };
        document.getElementById('publishBtn').onclick = () => this.publishItem();
        document.getElementById('cancelBtn').onclick = () => { this.uploadedImages = []; this.updatePhotoPreview(); this.showScreen('feed'); };
        document.getElementById('loginBtn').onclick = () => this.login();
        document.getElementById('registerBtn').onclick = () => this.register();
        document.getElementById('logoutBtn').onclick = () => this.logout();
        document.getElementById('myItemsBtn').onclick = () => this.showMyItems();
        document.getElementById('settingsBtn').onclick = () => this.openSettings();
        document.getElementById('changeCityBtn').onclick = () => this.changeCity();
        document.getElementById('deleteAccountBtn').onclick = () => this.deleteAccount();
        document.getElementById('closeSettingsBtn').onclick = () => document.getElementById('settingsModal').style.display = 'none';
        document.getElementById('themeToggle').onchange = (e) => this.setTheme(e.target.checked);
        
        document.querySelectorAll('#formFilters .filter-pill').forEach(pill => {
            pill.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('#formFilters .filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
            };
        });
        
        document.getElementById('phoneInput').addEventListener('input', (e) => {
            let value = e.target.value;
            if(value.startsWith('+7') && value.replace(/\D/g, '').length > 12) {
                this.showNotification('Номер телефона должен содержать 11 цифр после +7', true);
            }
        });
        
        document.getElementById('itemModal').onclick = (e) => { 
            if(e.target === document.getElementById('itemModal')) {
                document.getElementById('itemModal').style.display = 'none';
            }
        };
    }

    updatePhotoPreview() {
        const preview = document.getElementById('photoPreview');
        preview.innerHTML = '';
        this.uploadedImages.forEach((imgData, index) => {
            const div = document.createElement('div');
            div.className = 'photo-preview-item';
            div.innerHTML = `
                <img src="${imgData}" alt="Фото ${index+1}">
                <button class="remove-photo" data-index="${index}"><i class="fas fa-times"></i></button>
            `;
            preview.appendChild(div);
        });
        document.getElementById('photoCount').innerText = this.uploadedImages.length;
        document.querySelectorAll('.remove-photo').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                this.uploadedImages.splice(index, 1);
                this.updatePhotoPreview();
            };
        });
        const upload = document.getElementById('photoUpload');
        if(this.uploadedImages.length >= 5) {
            upload.classList.add('disabled');
        } else {
            upload.classList.remove('disabled');
        }
    }

    getFilteredItems() {
        let filtered = this.items.filter(i => {
            const matchFilter = this.currentFilter === 'all' || i.category === this.currentFilter;
            const matchSearch = i.title.toLowerCase().includes(this.currentSearch.toLowerCase());
            const matchCity = this.showingMyItems ? true : i.city === this.currentCity;
            return matchFilter && matchSearch && matchCity;
        });
        if(this.showingMyItems && this.currentUser) {
            filtered = filtered.filter(i => i.seller === this.currentUser.name);
        }
        return filtered;
    }

    renderFeed() {
        const filtered = this.getFilteredItems();
        const start = (this.currentPage-1)*this.itemsPerPage;
        const pageItems = filtered.slice(start, start+this.itemsPerPage);
        const totalPages = Math.ceil(filtered.length/this.itemsPerPage);
        
        document.getElementById('cardsGrid').innerHTML = pageItems.map(item => {
            const images = item.images || [item.image || '📦'];
            const imageCount = images.length;
            const sliderId = `slider-${item.id}`;
            
            const slides = images.map(img => {
                if(img.startsWith('data:')) {
                    return `<img src="${img}" alt="Фото">`;
                } else {
                    return `<div class="slide-item">${img}</div>`;
                }
            }).join('');
            
            return `
            <div class="card" data-id="${item.id}">
                ${this.showingMyItems && this.currentUser && item.seller === this.currentUser.name ? 
                    `<button class="delete-item-btn" data-id="${item.id}"><i class="fas fa-trash"></i></button>` : ''}
                <div class="card-image" id="${sliderId}">
                    <div class="card-image-slider" style="transform: translateX(0%);">
                        ${slides}
                    </div>
                    ${imageCount > 1 ? `
                        <button class="slider-btn prev" data-id="${item.id}"><i class="fas fa-chevron-left"></i></button>
                        <button class="slider-btn next" data-id="${item.id}"><i class="fas fa-chevron-right"></i></button>
                        <div class="slider-dots">
                            ${images.map((_, idx) => `<div class="slider-dot ${idx === 0 ? 'active' : ''}" data-id="${item.id}" data-index="${idx}"></div>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <div class="card-title">${item.title}</div>
                    <div class="card-description">${item.desc.substring(0,80)}</div>
                    <div class="card-contacts">
                        <p><i class="fas fa-phone"></i> ${item.phone || 'не указан'}</p>
                    </div>
                    <div class="card-meta">
                        <span><i class="fas fa-map-marker-alt"></i> ${item.city}</span>
                        <span><i class="fas fa-tag"></i> ${item.category === 'home' ? 'Дом' : item.category === 'clothes' ? 'Одежда' : item.category === 'books' ? 'Книги' : item.category === 'kids' ? 'Детям' : item.category === 'pets' ? 'Питомцы' : item.category === 'sport' ? 'Спорт' : item.category === 'tech' ? 'Техника' : 'Разное'}</span>
                    </div>
                </div>
            </div>
        `}).join('');
        
        document.querySelectorAll('.card-image').forEach(container => {
            const id = container.id.replace('slider-', '');
            if(!this.sliderStates[id]) {
                this.sliderStates[id] = { current: 0 };
            }
            const slider = container.querySelector('.card-image-slider');
            const slides = slider ? slider.children : [];
            if(slides.length > 1) {
                const state = this.sliderStates[id];
                const updateSlider = () => {
                    slider.style.transform = `translateX(-${state.current * 100}%)`;
                    const dots = container.querySelectorAll('.slider-dot');
                    dots.forEach((dot, idx) => {
                        dot.classList.toggle('active', idx === state.current);
                    });
                };
                
                container.querySelector('.slider-btn.prev')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.current = (state.current - 1 + slides.length) % slides.length;
                    updateSlider();
                });
                
                container.querySelector('.slider-btn.next')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.current = (state.current + 1) % slides.length;
                    updateSlider();
                });
                
                container.querySelectorAll('.slider-dot').forEach(dot => {
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        state.current = parseInt(dot.dataset.index);
                        updateSlider();
                    });
                });
            }
        });
        
        document.querySelectorAll('.card').forEach(card => {
            card.onclick = (e) => {
                if(e.target.closest('.delete-item-btn') || e.target.closest('.slider-btn') || e.target.closest('.slider-dot')) return;
                this.showItemDetail(parseInt(card.dataset.id));
            };
        });
        
        document.querySelectorAll('.delete-item-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                this.deleteItem(parseInt(btn.dataset.id));
            };
        });
        
        document.getElementById('currentPage').innerText = this.currentPage;
        document.getElementById('totalPages').innerText = totalPages || 1;
        document.getElementById('prevPage').disabled = this.currentPage === 1;
        document.getElementById('nextPage').disabled = this.currentPage === totalPages;
    }

    deleteItem(id) {
        if(confirm('Вы уверены, что хотите удалить это объявление?')) {
            this.items = this.items.filter(i => i.id !== id);
            this.saveData();
            this.showNotification('Объявление удалено');
            this.renderFeed();
        }
    }

    showItemDetail(id) {
        const item = this.items.find(i => i.id === id);
        if(!item) return;
        const images = item.images || [item.image || '📦'];
        const imageCount = images.length;
        const modalId = `modal-${id}`;
        
        const slides = images.map(img => {
            if(img.startsWith('data:')) {
                return `<div class="modal-slide"><img src="${img}" alt="Фото"></div>`;
            } else {
                return `<div class="modal-slide"><div class="slide-emoji">${img}</div></div>`;
            }
        }).join('');
        
        document.getElementById('modalContent').innerHTML = `
            <button class="modal-close-btn" id="modalCloseBtn"><i class="fas fa-times"></i></button>
            <h2>${item.title}</h2>
            <div class="modal-slider-container" id="${modalId}">
                <div class="modal-slider" style="transform: translateX(0%);">
                    ${slides}
                </div>
                ${imageCount > 1 ? `
                    <button class="modal-slider-btn prev" data-modal-id="${id}"><i class="fas fa-chevron-left"></i></button>
                    <button class="modal-slider-btn next" data-modal-id="${id}"><i class="fas fa-chevron-right"></i></button>
                ` : ''}
            </div>
            ${imageCount > 1 ? `
                <div class="modal-slider-dots" id="modalDots-${id}">
                    ${images.map((_, idx) => `<div class="modal-slider-dot ${idx === 0 ? 'active' : ''}" data-modal-id="${id}" data-index="${idx}"></div>`).join('')}
                </div>
                <div class="modal-image-counter">${this.getImageCounterText(1, imageCount)}</div>
            ` : ''}
            <p><strong>Описание:</strong> ${item.desc}</p>
            <p><strong>Город:</strong> ${item.city}</p>
            <p><strong>Категория:</strong> ${item.category === 'home' ? 'Дом' : item.category === 'clothes' ? 'Одежда' : item.category === 'books' ? 'Книги' : item.category === 'kids' ? 'Детям' : item.category === 'pets' ? 'Питомцы' : item.category === 'sport' ? 'Спорт' : item.category === 'tech' ? 'Техника' : 'Разное'}</p>
            <div style="background:rgba(77,166,179,0.1);padding:15px;border-radius:12px;margin:15px 0">
                <h4>Контакт продавца:</h4>
                <p><i class="fas fa-phone"></i> ${item.phone || 'не указан'}</p>
            </div>
            <div style="background:rgba(77,179,138,0.1);padding:15px;border-radius:12px">
                <h4>Система оплаты/обмена</h4>
                <p>Вы можете связаться с продавцом для договорённости об обмене или оплате наличными/картой при встрече.</p>
                <button class="btn-primary" id="contactSellerBtn" style="margin-top:10px">Связаться с продавцом</button>
            </div>
        `;
        
        document.getElementById('itemModal').style.display = 'flex';
        
        if(imageCount > 1) {
            if(!this.modalSliderState[id]) {
                this.modalSliderState[id] = { current: 0 };
            }
            const state = this.modalSliderState[id];
            const modalSlider = document.querySelector(`#${modalId} .modal-slider`);
            const totalSlides = images.length;
            
            const updateModalSlider = () => {
                modalSlider.style.transform = `translateX(-${state.current * 100}%)`;
                const dots = document.querySelectorAll(`#modalDots-${id} .modal-slider-dot`);
                dots.forEach((dot, idx) => {
                    dot.classList.toggle('active', idx === state.current);
                });
                const counter = document.querySelector('.modal-image-counter');
                if(counter) {
                    counter.textContent = this.getImageCounterText(state.current + 1, totalSlides);
                }
            };
            
            document.querySelector(`#${modalId} .modal-slider-btn.prev`)?.addEventListener('click', (e) => {
                e.stopPropagation();
                state.current = (state.current - 1 + totalSlides) % totalSlides;
                updateModalSlider();
            });
            
            document.querySelector(`#${modalId} .modal-slider-btn.next`)?.addEventListener('click', (e) => {
                e.stopPropagation();
                state.current = (state.current + 1) % totalSlides;
                updateModalSlider();
            });
            
            document.querySelectorAll(`#modalDots-${id} .modal-slider-dot`).forEach(dot => {
                dot.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.current = parseInt(dot.dataset.index);
                    updateModalSlider();
                });
            });
        }
        
        document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
            document.getElementById('itemModal').style.display = 'none';
        });
        
        document.getElementById('contactSellerBtn')?.addEventListener('click', () => { 
            this.showNotification(`Контакт продавца: ${item.phone || 'не указан'}`); 
        });
    }

    getImageCounterText(current, total) {
        return `Фото ${current} из ${total}`;
    }

    validatePhone(phone) {
        const digits = phone.replace(/\D/g, '');
        if(phone.startsWith('+7') && digits.length === 11) return true;
        if(phone.startsWith('8') && digits.length === 11) return true;
        if(phone.match(/^\d{10,11}$/)) return true;
        return false;
    }

    publishItem() {
        if(!this.currentUser) { this.showNotification('Сначала войдите в аккаунт!', true); this.toggleProfile(); return; }
        const title = document.getElementById('itemTitle').value.trim();
        const desc = document.getElementById('itemDescription').value.trim();
        const city = document.getElementById('citySelect').value;
        let phone = document.getElementById('phoneInput').value.trim();
        const activeCategory = document.querySelector('#formFilters .filter-pill.active');
        const category = activeCategory ? activeCategory.dataset.category : 'home';
        
        if(!title || !city || !phone) { this.showNotification('Заполните все обязательные поля', true); return; }
        if(!this.validatePhone(phone)) {
            this.showNotification('Введите корректный номер телефона (11 цифр, например +79001234567)', true);
            return;
        }
        if(this.uploadedImages.length === 0) {
            this.showNotification('Добавьте хотя бы одно фото', true);
            return;
        }
        
        const newItem = { 
            id: Date.now(), 
            title, 
            desc, 
            category, 
            city, 
            phone: phone, 
            seller: this.currentUser.name, 
            images: this.uploadedImages.slice()
        };
        this.items.unshift(newItem);
        this.saveData();
        this.showNotification('✅ Объявление опубликовано!');
        this.uploadedImages = [];
        this.updatePhotoPreview();
        this.resetForm();
        this.showScreen('feed');
        this.renderFeed();
    }

    resetForm() {
        document.getElementById('itemTitle').value = '';
        document.getElementById('itemDescription').value = '';
        document.getElementById('citySelect').value = '';
        document.getElementById('phoneInput').value = '';
        document.getElementById('photoInput').value = '';
        document.querySelectorAll('#formFilters .filter-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('#formFilters .filter-pill[data-category="home"]').classList.add('active');
    }

    login() {
        const name = document.getElementById('loginName').value.trim();
        const phone = document.getElementById('loginPhone').value.trim();
        if(!name) { this.showNotification('Введите имя', true); return; }
        const user = this.users.find(u => u.name === name);
        if(user) { 
            this.currentUser = user; 
            this.saveData(); 
            this.updateProfileUI(); 
            this.showNotification(`Добро пожаловать, ${name}!`); 
            this.toggleProfile(); 
            this.renderFeed(); 
        } else { 
            this.showNotification('Пользователь не найден', true); 
        }
    }

    register() {
        const name = document.getElementById('loginName').value.trim();
        const phone = document.getElementById('loginPhone').value.trim();
        
        const consentCheckbox = document.getElementById('consentCheckbox');
        if(!consentCheckbox.checked) {
            this.showNotification('⚠️ Для создания аккаунта необходимо дать согласие на обработку персональных данных', true);
            consentCheckbox.style.outline = '2px solid #ef4444';
            consentCheckbox.style.outlineOffset = '2px';
            setTimeout(() => {
                consentCheckbox.style.outline = 'none';
            }, 3000);
            return;
        }
        
        if(!name) { 
            this.showNotification('Введите имя', true); 
            return; 
        }
        if(!this.validatePhone(phone)) {
            this.showNotification('Введите корректный номер телефона (11 цифр, например +79001234567)', true);
            return;
        }
        if(this.users.find(u => u.name === name)) { 
            this.showNotification('Имя уже существует', true); 
            return; 
        }
        
        const newUser = { name, city: this.currentCity, phone: phone };
        this.users.push(newUser);
        this.currentUser = newUser;
        this.saveData();
        this.updateProfileUI();
        this.showNotification(`✅ Аккаунт создан! Добро пожаловать, ${name}`);
        this.toggleProfile();
        this.renderFeed();
    }

    logout() { 
        this.currentUser = null; 
        this.showingMyItems = false; 
        this.saveData(); 
        this.updateProfileUI(); 
        this.showNotification('Вы вышли из аккаунта'); 
        this.toggleProfile(); 
        this.renderFeed(); 
    }

    deleteAccount() {
        if(confirm('Вы уверены, что хотите удалить аккаунт? Все ваши объявления будут удалены безвозвратно!')) {
            this.items = this.items.filter(i => i.seller !== this.currentUser.name);
            this.users = this.users.filter(u => u.name !== this.currentUser.name);
            this.currentUser = null;
            this.showingMyItems = false;
            this.saveData();
            this.updateProfileUI();
            this.showNotification('Аккаунт удалён');
            this.toggleProfile();
            this.renderFeed();
        }
    }

    updateProfileUI() {
        const isAuth = !!this.currentUser;
        document.getElementById('authSection').style.display = isAuth ? 'none' : 'block';
        document.getElementById('userButtons').style.display = isAuth ? 'flex' : 'none';
        if(this.currentUser) {
            document.getElementById('profileName').innerText = this.currentUser.name;
            document.getElementById('profileStatus').innerText = `${this.currentCity} • Активен`;
        } else {
            document.getElementById('profileName').innerText = 'Гость';
            document.getElementById('profileStatus').innerText = 'Не авторизован';
        }
    }

    showMyItems() { 
        this.showingMyItems = true; 
        this.currentFilter = 'all'; 
        this.currentPage = 1; 
        document.querySelectorAll('#mainFilters .filter-pill').forEach(f=>f.classList.remove('active'));
        document.querySelector('#mainFilters .filter-pill[data-category="all"]').classList.add('active');
        this.renderFeed(); 
        this.toggleProfile(); 
        this.showNotification('Ваши объявления'); 
    }

    openSettings() { 
        document.getElementById('settingsModal').style.display = 'flex'; 
        document.getElementById('themeToggle').checked = document.body.getAttribute('data-theme') === 'dark'; 
    }

    setTheme(isDark) { 
        if(isDark) document.body.setAttribute('data-theme', 'dark'); 
        else document.body.removeAttribute('data-theme'); 
        localStorage.setItem('theme', isDark ? 'dark' : 'light'); 
    }

    loadTheme() { 
        const theme = localStorage.getItem('theme'); 
        if(theme === 'dark') document.body.setAttribute('data-theme', 'dark'); 
    }

    changeCity() { 
        const newCity = prompt('Введите ваш город:', this.currentCity); 
        if(newCity && newCity.trim()) { 
            if(newCity.trim().length < 2) {
                this.showNotification('Некорректное название города', true);
                return;
            }
            this.currentCity = newCity.trim(); 
            this.saveData(); 
            this.updateProfileUI(); 
            this.currentPage=1; 
            this.renderFeed(); 
            this.showNotification(`Город изменён на ${this.currentCity}`); 
            this.toggleProfile(); 
        } else if(newCity === '') {
            this.showNotification('Некорректный ввод города', true);
        }
    }

    showScreen(screen) { 
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); 
        document.getElementById(`${screen}Screen`).classList.add('active'); 
        if(screen === 'feed') { 
            this.renderFeed(); 
        }
        document.querySelectorAll('.icon-button').forEach(b=>b.classList.remove('active')); 
        document.getElementById(screen === 'feed' ? 'homeBtn' : 'addBtn').classList.add('active'); 
    }

    toggleProfile() { 
        const ov = document.getElementById('profileOverlay'); 
        ov.style.display = ov.style.display === 'flex' ? 'none' : 'flex'; 
    }

    showNotification(msg, isError = false) { 
        const n = document.getElementById('notification'); 
        n.innerText = msg; 
        n.classList.add('show');
        if(isError) n.classList.add('error');
        else n.classList.remove('error');
        setTimeout(() => { 
            n.classList.remove('show');
            n.classList.remove('error');
        }, 4000); 
    }
}

// Глобальная функция для показа политики конфиденциальности
function showPrivacyPolicy() {
    alert('Политика конфиденциальности:\n\n' +
          'Ваш номер телефона используется только для связи по объявлениям.\n' +
          'Мы не передаём ваши данные третьим лицам.\n' +
          'Вы можете удалить свои данные в любой момент в настройках профиля.');
}

document.addEventListener('DOMContentLoaded', () => new DarKrugApp());