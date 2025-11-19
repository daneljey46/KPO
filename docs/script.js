const PozDravApp = {
    init: function() {
        this.bindEvents();
        this.loadContacts();
        this.updateContactSelects();
        this.displayCurrentDate();
    },
    // Привязка событий
    bindEvents: function() {
        // Навигация
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', this.handleNavigation.bind(this));
        });
        // Формы
        document.getElementById('contact-form').addEventListener('submit', this.handleContactSubmit.bind(this));
        document.getElementById('generation-form').addEventListener('submit', this.handleGenerationSubmit.bind(this));
        document.getElementById('sending-form').addEventListener('submit', this.handleSendingSubmit.bind(this));
        // Кнопки
        document.getElementById('edit-greeting').addEventListener('click', this.editGreeting.bind(this));
        document.getElementById('save-greeting').addEventListener('click', this.saveGreeting.bind(this));
        document.getElementById('send-now').addEventListener('click', this.sendNow.bind(this));
        document.getElementById('apply-filters').addEventListener('click', this.applyArchiveFilters.bind(this));
        document.getElementById('select-all').addEventListener('change', this.toggleSelectAll.bind(this));
        // Поиск
        document.getElementById('search-contacts').addEventListener('input', this.searchContacts.bind(this));
        // Модальное окно
        document.querySelector('.close').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('modal-cancel').addEventListener('click', this.closeModal.bind(this));
        document.getElementById('modal-confirm').addEventListener('click', this.handleModalConfirm.bind(this));
        // Закрытие модального окна при клике вне его
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('modal');
            if (e.target === modal) {
                this.closeModal();
            }
        });
    },

    handleNavigation: function(e) {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.target.classList.add('active');
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetId = e.target.getAttribute('href').substring(1);
        document.getElementById(targetId).classList.add('active');
    },

    // Временный костыль для хранения данных
    data: {
        contacts: JSON.parse(localStorage.getItem('pozdraw-contacts')) || [],
        greetings: JSON.parse(localStorage.getItem('pozdraw-greetings')) || [],
        scheduled: JSON.parse(localStorage.getItem('pozdraw-scheduled')) || [],
        archive: JSON.parse(localStorage.getItem('pozdraw-archive')) || []
    },

    // Временный костыль для хранения данных
    saveData: function() {
        localStorage.setItem('pozdraw-contacts', JSON.stringify(this.data.contacts));
        localStorage.setItem('pozdraw-greetings', JSON.stringify(this.data.greetings));
        localStorage.setItem('pozdraw-scheduled', JSON.stringify(this.data.scheduled));
        localStorage.setItem('pozdraw-archive', JSON.stringify(this.data.archive));
    },

    loadContacts: function() {
        const container = document.getElementById('contacts-container');
        
        if (this.data.contacts.length === 0) {
            container.innerHTML = '<div class="card text-center"><p>Контакты не добавлены</p></div>';
            return;
        }
        
        container.innerHTML = this.data.contacts.map(contact => `
            <div class="card" data-contact-id="${contact.id}">
                <div class="card-header">
                    <div class="card-title">${contact.name}</div>
                    <div class="card-actions">
                        <button class="card-action edit-contact" title="Редактировать">
                            <i>✏️</i>
                        </button>
                        <button class="card-action delete-contact" title="Удалить">
                            <i>🗑️</i>
                        </button>
                    </div>
                </div>
                <div class="card-details">
                    <div class="detail-item">
                        <span class="detail-label">Пол</span>
                        <span class="detail-value">${contact.gender === 'male' ? 'Мужской' : 'Женский'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Возраст</span>
                        <span class="detail-value">${contact.age} лет</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Дата рождения</span>
                        <span class="detail-value">${this.formatDate(contact.birthdate)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Telegram</span>
                        <span class="detail-value">${contact.telegram}</span>
                    </div>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Увлечения</span>
                    <span class="detail-value">${contact.hobbies || 'Не указаны'}</span>
                </div>
            </div>
        `).join('');
        
        container.querySelectorAll('.edit-contact').forEach(btn => {
            btn.addEventListener('click', this.editContact.bind(this));
        });
        
        container.querySelectorAll('.delete-contact').forEach(btn => {
            btn.addEventListener('click', this.deleteContact.bind(this));
        });
    },

    updateContactSelects: function() {
        const selects = [
            document.getElementById('selected-contact'),
            document.getElementById('filter-contact'),
            document.getElementById('contacts-selection')
        ];
        
        selects.forEach(select => {
            if (!select) return;
            const currentValue = select.value;
            
            while (select.options.length > 1) {
                select.remove(1);
            }
            this.data.contacts.forEach(contact => {
                const option = document.createElement('option');
                option.value = contact.id;
                option.textContent = contact.name;
                select.appendChild(option);
            });
            
            if (currentValue && this.data.contacts.some(c => c.id === currentValue)) {
                select.value = currentValue;
            }
        });
        
        const contactsSelection = document.getElementById('contacts-selection');
        if (contactsSelection) {
            contactsSelection.innerHTML = '';
            this.data.contacts.forEach(contact => {
                const div = document.createElement('div');
                div.className = 'contact-checkbox';
                div.innerHTML = `
                    <input type="checkbox" id="contact-${contact.id}" name="contacts" value="${contact.id}">
                    <label for="contact-${contact.id}">${contact.name}</label>
                `;
                contactsSelection.appendChild(div);
            });
        }
    },

    // Добавление контакта
    handleContactSubmit: function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const contact = {
            id: Date.now().toString(),
            name: formData.get('name'),
            gender: formData.get('gender'),
            birthdate: formData.get('birthdate'),
            age: parseInt(formData.get('age')),
            hobbies: formData.get('hobbies'),
            telegram: formData.get('telegram'),
            createdAt: new Date().toISOString()
        };
        
        this.data.contacts.push(contact);
        this.saveData();
        this.loadContacts();
        this.updateContactSelects();
        
        e.target.reset();
        this.showNotification('Контакт успешно добавлен', 'success');
    },

    // Редактирование контакта
    editContact: function(e) {
        const card = e.target.closest('.card');
        const contactId = card.getAttribute('data-contact-id');
        const contact = this.data.contacts.find(c => c.id === contactId);
        
        if (!contact) return;
        
        document.getElementById('name').value = contact.name;
        document.getElementById('gender').value = contact.gender;
        document.getElementById('birthdate').value = contact.birthdate;
        document.getElementById('age').value = contact.age;
        document.getElementById('hobbies').value = contact.hobbies || '';
        document.getElementById('telegram').value = contact.telegram;
        
        this.data.contacts = this.data.contacts.filter(c => c.id !== contactId);
        this.saveData();
        this.loadContacts();
        
        this.showNotification('Контакт готов к редактированию', 'info');
    },

    // Удаление контакта
    deleteContact: function(e) {
        const card = e.target.closest('.card');
        const contactId = card.getAttribute('data-contact-id');
        const contact = this.data.contacts.find(c => c.id === contactId);
        
        if (!contact) return;
        
        this.showModal(
            'Удаление контакта',
            `Вы уверены, что хотите удалить контакт "${contact.name}"?`,
            () => {
                this.data.contacts = this.data.contacts.filter(c => c.id !== contactId);
                this.saveData();
                this.loadContacts();
                this.updateContactSelects();
                this.showNotification('Контакт удален', 'success');
            }
        );
    },

    // Генерация поздравления
    handleGenerationSubmit: function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const contactId = formData.get('selected-contact');
        const style = formData.get('style');
        const customText = formData.get('custom-text');
        
        const contact = this.data.contacts.find(c => c.id === contactId);
        if (!contact) {
            this.showNotification('Выберите контакт', 'error');
            return;
        }
        
        // Генерация поздравления
        const greeting = this.generateGreeting(contact, style, customText);
        
        // Сохранение
        this.currentGreeting = {
            id: Date.now().toString(),
            contactId: contact.id,
            contactName: contact.name,
            style: style,
            text: greeting,
            customText: customText,
            createdAt: new Date().toISOString()
        };
        
        // Предпросмотр
        document.getElementById('greeting-preview').innerHTML = `
            <div>
                <p><strong>Для:</strong> ${contact.name}</p>
                <p><strong>Стиль:</strong> ${this.getStyleName(style)}</p>
                <hr>
                <p>${greeting}</p>
            </div>
        `;
        
        // Активируем кнопки действий
        document.getElementById('edit-greeting').disabled = false;
        document.getElementById('save-greeting').disabled = false;
        document.getElementById('send-now').disabled = false;
        
        this.showNotification('Поздравление сгенерировано', 'success');
    },

    // Псевдо генерация текста поздравления
    generateGreeting: function(contact, style, customText) {
        const templates = {
            friendly: {
                male: [
                    `Дорогой ${contact.name}! От всей души желаю тебе в твой ${contact.age}-й день рождения здоровья, счастья и успехов во всех начинаниях!`,
                    `С днем рождения, ${contact.name}! Пусть каждый день приносит радость, а все мечты сбываются!`
                ],
                female: [
                    `Дорогая ${contact.name}! От всего сердца поздравляю с днем рождения! Желаю тебе оставаться такой же прекрасной и удивительной!`,
                    `С днем рождения, ${contact.name}! Пусть жизнь будет наполнена яркими моментами и счастливыми событиями!`
                ]
            },
            official: {
                male: [
                    `Уважаемый ${contact.name}! Примите наши искренние поздравления с днем рождения! Желаем профессиональных успехов и благополучия!`,
                    `Глубокоуважаемый ${contact.name}! Поздравляем Вас с днем рождения и желаем крепкого здоровья и процветания!`
                ],
                female: [
                    `Уважаемая ${contact.name}! Примите наши теплые поздравления с днем рождения! Желаем Вам счастья, здоровья и успехов!`,
                    `Глубокоуважаемая ${contact.name}! Поздравляем Вас с днем рождения и желаем благополучия во всех сферах жизни!`
                ]
            },
            funny: {
                male: [
                    `Привет, ${contact.name}! С днем рождения! Желаю, чтобы количество денег в кошельке росло быстрее, чем количество свечек на торте!`,
                    `${contact.name}, с днем рождения! Пусть твои проблемы решаются так же легко, как уровень в твоей любимой игре!`
                ],
                female: [
                    `${contact.name}, с днем рождения! Желаю, чтобы скидки преследовали тебя по пятам, а отражение в зеркале всегда радовало!`,
                    `Поздравляю, ${contact.name}! Пусть в твоей жизни будет больше поводов для улыбок, чем непрочитанных сообщений в телефоне!`
                ]
            }
        };
        
        const genderTemplates = templates[style][contact.gender] || templates[style].male;
        const baseText = genderTemplates[Math.floor(Math.random() * genderTemplates.length)];
        
        let finalText = baseText;
        if (contact.hobbies) {
            const hobbies = contact.hobbies.split(',').map(h => h.trim());
            const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
            
            const hobbyPhrases = [
                ` Особенно успехов в ${hobby}!`,
                ` Удачи в твоем увлечении ${hobby}!`,
                ` Пусть ${hobby} приносит тебе только радость!`
            ];
            
            finalText += hobbyPhrases[Math.floor(Math.random() * hobbyPhrases.length)];
        }
        
        if (customText) {
            finalText += ` ${customText}`;
        }
        
        return finalText;
    },

    getStyleName: function(style) {
        const styles = {
            friendly: 'Дружеский',
            official: 'Официальный',
            funny: 'Шуточный'
        };
        return styles[style] || style;
    },

    // Редактирование поздравления
    editGreeting: function() {
        if (!this.currentGreeting) return;
        
        document.getElementById('custom-text').value = this.currentGreeting.customText || '';
        document.getElementById('custom-text').focus();
        
        this.showNotification('Теперь вы можете отредактировать текст поздравления', 'info');
    },

    // Сохранение поздравления в архив
    saveGreeting: function() {
        if (!this.currentGreeting) return;
        
        this.data.greetings.push(this.currentGreeting);
        this.saveData();
        
        this.showNotification('Поздравление сохранено в архив', 'success');
    },

    // Костыль отправки поздравления
    sendNow: function() {
        if (!this.currentGreeting) return;
        
        const archiveItem = {
            ...this.currentGreeting,
            sentAt: new Date().toISOString(),
            status: 'sent'
        };
        
        this.data.archive.push(archiveItem);
        this.saveData();
        
        this.showNotification('Поздравление отправлено!', 'success');
    },

    // Планирование рассылки
    handleSendingSubmit: function(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const date = formData.get('sending-date');
        const time = formData.get('sending-time');
        const selectedContacts = Array.from(formData.getAll('contacts'));
        
        if (selectedContacts.length === 0) {
            this.showNotification('Выберите хотя бы один контакт', 'error');
            return;
        }
        
        const scheduledItem = {
            id: Date.now().toString(),
            date: date,
            time: time,
            contactIds: selectedContacts,
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };
        
        this.data.scheduled.push(scheduledItem);
        this.saveData();
        this.loadScheduled();
        
        e.target.reset();
        this.showNotification('Рассылка запланирована', 'success');
    },

    // Загрузка запланированных рассылок
    loadScheduled: function() {
        const container = document.getElementById('scheduled-container');
        
        if (this.data.scheduled.length === 0) {
            container.innerHTML = '<div class="card text-center"><p>Нет запланированных рассылок</p></div>';
            return;
        }
        
        container.innerHTML = this.data.scheduled.map(item => {
            const contactNames = item.contactIds.map(id => {
                const contact = this.data.contacts.find(c => c.id === id);
                return contact ? contact.name : 'Неизвестный контакт';
            }).join(', ');
            
            return `
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Рассылка на ${this.formatDate(item.date)} в ${item.time}</div>
                        <div class="card-actions">
                            <span class="status-badge status-scheduled">Запланировано</span>
                            <button class="card-action delete-scheduled" title="Отменить рассылку">
                                <i>🗑️</i>
                            </button>
                        </div>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Контакты</span>
                        <span class="detail-value">${contactNames}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Создано</span>
                        <span class="detail-value">${this.formatDateTime(item.createdAt)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        container.querySelectorAll('.delete-scheduled').forEach(btn => {
            btn.addEventListener('click', this.deleteScheduled.bind(this));
        });
    },

    // Удаление запланированной рассылки
    deleteScheduled: function(e) {
        const card = e.target.closest('.card');
        const itemIndex = Array.from(card.parentNode.children).indexOf(card);
        
        this.showModal(
            'Отмена рассылки',
            'Вы уверены, что хотите отменить эту рассылку?',
            () => {
                this.data.scheduled.splice(itemIndex, 1);
                this.saveData();
                this.loadScheduled();
                this.showNotification('Рассылка отменена', 'success');
            }
        );
    },

    toggleSelectAll: function(e) {
        const checkboxes = document.querySelectorAll('input[name="contacts"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = e.target.checked;
        });
    },

    // Поиск контактов
    searchContacts: function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const cards = document.querySelectorAll('#contacts-container .card');
        
        cards.forEach(card => {
            const name = card.querySelector('.card-title').textContent.toLowerCase();
            if (name.includes(searchTerm)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    },

    // Костыльный фильтр в архиве
    applyArchiveFilters: function() {
        this.showNotification('Фильтры применены', 'info');
    },

    // Отображение текущей даты в полях
    displayCurrentDate: function() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('sending-date').min = today;
        document.getElementById('filter-date').value = today;
    },

    // Форматирование даты
    formatDate: function(dateString) {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    },

    // Форматирование даты и времени
    formatDateTime: function(dateTimeString) {
        const options = { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateTimeString).toLocaleDateString('ru-RU', options);
    },

    // Уведомление 
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;
        
        const colors = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
        
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    },

    // Показать модальное окно
    showModal: function(title, message, confirmCallback) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-body').textContent = message;
        document.getElementById('modal').style.display = 'block';
        
        this.currentModalCallback = confirmCallback;
    },

    // Закрыть модальное окно
    closeModal: function() {
        document.getElementById('modal').style.display = 'none';
        this.currentModalCallback = null;
    },

    // Обработка подтверждения в модальном окне
    handleModalConfirm: function() {
        if (this.currentModalCallback) {
            this.currentModalCallback();
        }
        this.closeModal();
    }
};

document.addEventListener('DOMContentLoaded', function() {
    PozDravApp.init();
});