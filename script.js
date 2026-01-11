// 출석 데이터 관리
class AttendanceManager {
    constructor() {
        this.storageKey = 'attendanceData';
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            records: [],
            totalDays: 0,
            currentStreak: 0
        };
    }

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    }

    checkAttendance() {
        const today = this.getTodayString();
        const now = new Date();
        const timeString = now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // 이미 오늘 출석했는지 확인
        const todayRecord = this.data.records.find(record => record.date === today);
        if (todayRecord) {
            return { success: false, message: '오늘은 이미 출석체크를 하셨습니다!' };
        }

        // 새 출석 기록 추가
        this.data.records.unshift({
            date: today,
            time: timeString,
            timestamp: now.getTime()
        });

        // 통계 업데이트
        this.updateStats();
        this.saveData();

        return { success: true, message: '출석체크 완료!' };
    }

    cancelAttendance() {
        const today = this.getTodayString();
        
        // 오늘 출석 기록 찾기
        const todayRecordIndex = this.data.records.findIndex(record => record.date === today);
        if (todayRecordIndex === -1) {
            return { success: false, message: '오늘 출석 기록이 없습니다.' };
        }

        // 오늘 출석 기록 제거
        this.data.records.splice(todayRecordIndex, 1);

        // 통계 업데이트
        this.updateStats();
        this.saveData();

        return { success: true, message: '출석이 취소되었습니다.' };
    }

    updateStats() {
        // 총 출석일
        this.data.totalDays = this.data.records.length;

        // 연속 출석일 계산
        this.data.currentStreak = this.calculateStreak();
    }

    calculateStreak() {
        if (this.data.records.length === 0) return 0;

        // 날짜 문자열을 로컬 날짜로 정렬
        const sortedRecords = [...this.data.records].sort((a, b) => {
            return b.date.localeCompare(a.date);
        });

        let streak = 0;
        const today = this.getTodayString();
        let expectedDate = today;

        for (let i = 0; i < sortedRecords.length; i++) {
            if (sortedRecords[i].date === expectedDate) {
                streak++;
                // 다음 날짜 계산 (로컬 날짜 기준)
                const date = new Date(expectedDate);
                date.setDate(date.getDate() - 1);
                expectedDate = this.formatDateString(date);
            } else {
                // 연속이 끊겼으므로 중단
                break;
            }
        }

        return streak;
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getAllAttendanceDates() {
        return this.data.records.map(record => record.date);
    }

    getTodayString() {
        // 디바이스의 로컬 날짜 사용 (핸드폰 날짜와 동일)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    isCheckedToday() {
        const today = this.getTodayString();
        return this.data.records.some(record => record.date === today);
    }

    getRecentRecords(limit = 10) {
        return this.data.records.slice(0, limit);
    }
}

// UI 관리
class AttendanceUI {
    constructor(manager) {
        this.manager = manager;
        this.checkBtn = document.getElementById('checkBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.statusMessage = document.getElementById('statusMessage');
        this.totalDaysEl = document.getElementById('totalDays');
        this.currentStreakEl = document.getElementById('currentStreak');
        this.headerStreakEl = document.getElementById('headerStreak');
        this.currentDateEl = document.getElementById('currentDate');
        this.historyListEl = document.getElementById('historyList');
        this.listView = document.getElementById('listView');
        this.calendarView = document.getElementById('calendarView');
        this.calendarContainer = document.getElementById('calendarContainer');
        this.calendarMonthEl = document.getElementById('calendarMonth');
        this.prevMonthBtn = document.getElementById('prevMonth');
        this.nextMonthBtn = document.getElementById('nextMonth');
        
        this.currentCalendarDate = new Date();
        this.viewMode = 'list';

        this.init();
    }

    init() {
        // 현재 날짜 표시
        this.updateDate();
        
        // 통계 업데이트
        this.updateStats();
        
        // 출석 기록 표시
        this.updateHistory();
        
        // 버튼 상태 확인
        this.updateButtonState();
        
        // 이벤트 리스너
        this.checkBtn.addEventListener('click', () => this.handleCheck());
        this.cancelBtn.addEventListener('click', () => this.handleCancel());
        
        // 뷰 토글 버튼
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchView(view);
            });
        });
        
        // 달력 네비게이션
        this.prevMonthBtn.addEventListener('click', () => this.changeMonth(-1));
        this.nextMonthBtn.addEventListener('click', () => this.changeMonth(1));
    }

    updateDate() {
        const today = new Date();
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
        };
        this.currentDateEl.textContent = today.toLocaleDateString('ko-KR', options);
    }

    updateStats() {
        this.totalDaysEl.textContent = this.manager.data.totalDays;
        this.currentStreakEl.textContent = this.manager.data.currentStreak;
        this.headerStreakEl.textContent = this.manager.data.currentStreak;
    }

    updateButtonState() {
        const isChecked = this.manager.isCheckedToday();
        if (isChecked) {
            this.checkBtn.classList.add('checked');
            this.checkBtn.querySelector('.btn-text').textContent = '출석 완료';
            this.cancelBtn.style.display = 'flex';
        } else {
            this.checkBtn.classList.remove('checked');
            this.checkBtn.querySelector('.btn-text').textContent = '출석체크';
            this.cancelBtn.style.display = 'none';
        }
    }

    handleCheck() {
        // 이미 출석했으면 즉시 피드백만 표시
        if (this.manager.isCheckedToday()) {
            this.showMessage('오늘은 이미 출석체크를 하셨습니다!', 'info');
            // 버튼에 약간의 애니메이션
            this.checkBtn.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.checkBtn.style.transform = '';
            }, 150);
            return;
        }

        // 즉각적인 시각적 피드백 (리플 효과)
        this.checkBtn.classList.add('ripple');
        setTimeout(() => {
            this.checkBtn.classList.remove('ripple');
        }, 600);

        // 출석 처리
        const result = this.manager.checkAttendance();
        
        if (result.success) {
            // 버튼 상태 즉시 업데이트 (애니메이션 효과 포함)
            this.updateButtonState();
            
            // 통계 업데이트 (약간의 딜레이로 부드러운 전환)
            setTimeout(() => {
                this.updateStats();
                this.updateHistory();
                if (this.viewMode === 'calendar') {
                    this.renderCalendar();
                }
            }, 300);

            // 성공 메시지 표시
            setTimeout(() => {
                this.showMessage('출석체크 완료!', 'success');
            }, 200);
        } else {
            this.showMessage(result.message, 'info');
        }
    }

    handleCancel() {
        // 취소 처리
        const result = this.manager.cancelAttendance();
        
        if (result.success) {
            // 버튼 상태 즉시 업데이트
            this.checkBtn.classList.remove('checked');
            this.checkBtn.querySelector('.btn-text').textContent = '출석체크';
            this.cancelBtn.style.display = 'none';
            
            // 통계 업데이트
            setTimeout(() => {
                this.updateStats();
                this.updateHistory();
                if (this.viewMode === 'calendar') {
                    this.renderCalendar();
                }
            }, 200);

            // 성공 메시지 표시
            this.showMessage('출석이 취소되었습니다.', 'info');
        } else {
            this.showMessage(result.message, 'info');
        }
    }

    showMessage(message, type) {
        this.statusMessage.textContent = message;
        this.statusMessage.className = `status-message show ${type}`;
        
        setTimeout(() => {
            this.statusMessage.classList.remove('show');
        }, 3000);
    }

    updateHistory() {
        const records = this.manager.getRecentRecords(10);
        
        if (records.length === 0) {
            this.historyListEl.innerHTML = '<p class="no-history">출석 기록이 없습니다.</p>';
            return;
        }

        this.historyListEl.innerHTML = records.map(record => {
            const date = new Date(record.date);
            const dateString = date.toLocaleDateString('ko-KR', {
                month: 'short',
                day: 'numeric',
                weekday: 'short'
            });

            return `
                <div class="history-item">
                    <div>
                        <div class="history-date">${dateString}</div>
                    </div>
                    <div class="history-time">${record.time}</div>
                </div>
            `;
        }).join('');
    }

    switchView(view) {
        this.viewMode = view;
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        if (view === 'list') {
            this.listView.style.display = 'block';
            this.calendarView.style.display = 'none';
        } else {
            this.listView.style.display = 'none';
            this.calendarView.style.display = 'block';
            this.renderCalendar();
        }
    }

    changeMonth(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        
        // 달력 제목 업데이트
        this.calendarMonthEl.textContent = `${year}년 ${month + 1}월`;
        
        // 해당 월의 첫 번째 날과 마지막 날
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // 주의 첫날 (일요일)
        
        // 출석 날짜 목록 가져오기
        const attendanceDates = this.manager.getAllAttendanceDates();
        
        let calendarHTML = '<div class="calendar-grid">';
        
        // 요일 헤더
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        calendarHTML += '<div class="calendar-weekdays">';
        weekdays.forEach(day => {
            calendarHTML += `<div class="calendar-weekday">${day}</div>`;
        });
        calendarHTML += '</div>';
        
        // 날짜 그리드
        calendarHTML += '<div class="calendar-days">';
        const currentDate = new Date(startDate);
        const today = this.manager.getTodayString();
        
        for (let i = 0; i < 42; i++) {
            const dateString = this.formatDateString(currentDate);
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = dateString === today;
            const isAttended = attendanceDates.includes(dateString);
            
            let dayClass = 'calendar-day';
            if (!isCurrentMonth) dayClass += ' other-month';
            if (isToday) dayClass += ' today';
            if (isAttended) dayClass += ' attended';
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateString}">
                    <span class="day-number">${currentDate.getDate()}</span>
                    ${isAttended ? '<span class="attendance-mark">✓</span>' : ''}
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendarHTML += '</div></div>';
        
        this.calendarContainer.innerHTML = calendarHTML;
    }

    formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// Service Worker 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker 등록 성공:', registration.scope);
            })
            .catch((error) => {
                console.log('ServiceWorker 등록 실패:', error);
            });
    });
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    const manager = new AttendanceManager();
    const ui = new AttendanceUI(manager);
});

