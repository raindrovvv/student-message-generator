// 전역 변수
let studentsData = [];
let isGenerating = false;

// CORS 프록시 URL
const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
];

let currentProxyIndex = 0;

// 토스트 메시지 표시
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

// 스프레드시트 ID 추출
function extractSheetId(url) {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
}

// CSV 파싱
function parseCSV(csv) {
    const lines = [];
    let currentLine = [];
    let currentCell = '';
    let inQuotes = false;
    
    for (let i = 0; i < csv.length; i++) {
        const char = csv[i];
        const nextChar = csv[i + 1];
        
        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentLine.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            currentLine.push(currentCell.trim());
            if (currentLine.some(cell => cell)) {
                lines.push(currentLine);
            }
            currentLine = [];
            currentCell = '';
            if (char === '\r') i++;
        } else if (char !== '\r') {
            currentCell += char;
        }
    }
    
    if (currentCell || currentLine.length > 0) {
        currentLine.push(currentCell.trim());
        if (currentLine.some(cell => cell)) {
            lines.push(currentLine);
        }
    }
    
    return lines;
}

// 데이터 불러오기
async function loadData() {
    const urlInput = document.getElementById('spreadsheetUrl').value;
    const sheetId = extractSheetId(urlInput);
    
    if (!sheetId) {
        showToast('올바른 구글 스프레드시트 URL을 입력해주세요.', 'error');
        return;
    }
    
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    
    try {
        document.getElementById('loadDataBtn').innerHTML = '<span class="loading"></span> 불러오는 중...';
        document.getElementById('loadDataBtn').disabled = true;
        
        const response = await fetch(csvUrl);
        
        if (!response.ok) {
            throw new Error('스프레드시트를 불러올 수 없습니다. 공개 설정을 확인해주세요.');
        }
        
        const csvText = await response.text();
        const rows = parseCSV(csvText);
        
        studentsData = [];
        
        for (let i = 3; i < rows.length; i++) {
            const row = rows[i];
            if (row[0] && row[0].trim() && row[0] !== '이름') {
                studentsData.push({
                    name: row[0] || '',
                    age: row[1] || '',
                    birthYear: row[2] || '',
                    phone: row[3] || '',
                    email: row[4] || '',
                    center: row[5] || '',
                    position: row[6] || '',
                    major: row[7] || '',
                    cppExp: row[8] || '',
                    unrealExp: row[9] || '',
                    score: row[10] || '',
                    devSkill: row[11] || '',
                    notes: row[12] || '',
                    mbti: row[13] || '',
                    message: ''
                });
            }
        }
        
        if (studentsData.length === 0) {
            throw new Error('수강생 데이터를 찾을 수 없습니다.');
        }
        
        document.getElementById('studentCount').textContent = studentsData.length;
        renderStudentList();
        document.getElementById('studentSection').style.display = 'block';
        showToast(`${studentsData.length}명의 수강생 데이터를 불러왔습니다!`, 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        document.getElementById('loadDataBtn').innerHTML = '📥 데이터 불러오기';
        document.getElementById('loadDataBtn').disabled = false;
    }
}

// 수강생 목록 렌더링
function renderStudentList() {
    const container = document.getElementById('studentList');
    container.innerHTML = '';
    
    studentsData.forEach((student, index) => {
        const card = document.createElement('div');
        card.className = `student-card ${student.message ? 'generated' : ''}`;
        card.id = `student-${index}`;
        
        card.innerHTML = `
            <div class="student-header">
                <span class="student-name">${student.name}</span>
                <div class="student-badges">
                    ${student.center ? `<span class="badge badge-center">${student.center}</span>` : ''}
                    ${student.position ? `<span class="badge badge-position">${student.position}</span>` : ''}
                    ${student.mbti ? `<span class="badge badge-mbti">${student.mbti}</span>` : ''}
                    ${student.score ? `<span class="badge badge-score">점수: ${student.score}</span>` : ''}
                </div>
            </div>
            
            <div class="student-info">
                <div class="info-item">
                    <span class="info-label">나이:</span>
                    <span class="info-value">${student.age ? student.age + '세' : '-'} ${student.birthYear ? '(' + student.birthYear + ')' : ''}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">전공:</span>
                    <span class="info-value">${student.major || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">C++ 경험:</span>
                    <span class="info-value">${student.cppExp || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">언리얼 경험:</span>
                    <span class="info-value">${student.unrealExp || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">개발능력:</span>
                    <span class="info-value">${student.devSkill || '-'}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">유의사항:</span>
                    <span class="info-value">${student.notes || '-'}</span>
                </div>
            </div>
            
            <div class="message-section">
                <div class="message-label">💌 매니저의 한마디</div>
                <div class="message-content" id="message-${index}">
                    ${student.message || '<span class="message-placeholder">메시지를 생성해주세요</span>'}
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn btn-primary btn-small" onclick="generateMessage(${index})" id="genBtn-${index}">
                    ✨ 메시지 생성
                </button>
                <button class="btn btn-secondary btn-small" onclick="copyMessage(${index})">
                    📋 복사
                </button>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Groq API로 메시지 생성
async function generateMessage(index) {
    const apiKey = document.getElementById('apiKey').value;
    
    if (!apiKey) {
        showToast('Groq API Key를 입력해주세요.', 'error');
        return;
    }
    
    const student = studentsData[index];
    const style = document.getElementById('messageStyle').value;
    const model = document.getElementById('modelSelect').value;
    
    const styleGuide = {
        warm: '따뜻하고 친근하면서도 정중한 말투로 작성하세요',
        professional: '전문적이고 격식있는 공식 축하 메시지처럼 작성하세요',
        energetic: '밝고 긍정적인 에너지가 느껴지는 말투로 작성하세요',
        mentoring: '선배가 후배에게 조언하듯 따뜻하고 진중하게 작성하세요'
    };
    
    const prompt = `당신은 게임 개발 교육과정의 매니저입니다. 최종 프로젝트를 마치고 수료하는 수강생에게 개인화된 격려 메시지를 작성해주세요.

## 수강생 정보
- 이름: ${student.name}
- 나이: ${student.age}세
- 전공: ${student.major || '비전공자'}
- 팀 포지션: ${student.position || '미정'}
- 최종 센터: ${student.center || '미정'}
- C++ 경험: ${student.cppExp || '없음'}
- 언리얼 경험: ${student.unrealExp || '없음'}
- 점수: ${student.score || '미정'}
- 개발능력: ${student.devSkill || '정보 없음'}
- 유의사항/특이사항: ${student.notes || '없음'}

## 메시지 스타일
${styleGuide[style]}

## 필수 작성 규칙
1. 반드시 존댓말(~습니다, ~세요, ~네요 등)로 작성하세요
2. 이름 뒤에 "님"을 붙이세요 (예: 홍길동님)
3. 100% 자연스러운 한국어만 사용하세요. 외국어, 한자, 이모지를 절대 섞지 마세요
4. MBTI는 언급하지 마세요
5. 2~3문장으로 간결하게 작성하세요
6. 수강생의 특성(전공 여부, 포지션, 성장 포인트 등)을 자연스럽게 반영하세요
7. 진심이 담긴 따뜻한 메시지로 작성하세요

## 좋은 예시
"홍길동님, 수료를 진심으로 축하드립니다. 비전공자로 시작하셨지만 꾸준한 노력으로 팀 프로젝트를 훌륭히 마무리하신 모습이 정말 인상적이었습니다. 앞으로의 게임 개발자로서의 여정도 응원하겠습니다."

메시지만 작성해주세요. 다른 설명 없이 메시지 내용만 출력하세요.`;

    const messageEl = document.getElementById(`message-${index}`);
    const genBtn = document.getElementById(`genBtn-${index}`);
    const card = document.getElementById(`student-${index}`);
    
    messageEl.innerHTML = '<span class="loading"></span> 메시지 생성 중...';
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="loading"></span> 생성 중...';
    card.classList.add('generating');
    card.classList.remove('generated');
    
    try {
        // 호스팅 환경에서는 직접 호출, 로컬에서는 CORS 프록시 사용
        let apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
        
        // 로컬 파일에서 실행 중인지 확인
        if (window.location.protocol === 'file:') {
            apiUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(apiUrl);
        }
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 512,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'API 요청 실패';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.error?.message || errorMessage;
            } catch (e) {
                errorMessage = errorText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const message = data.choices[0].message.content.trim();
        
        studentsData[index].message = message;
        messageEl.innerHTML = message;
        card.classList.remove('generating');
        card.classList.add('generated');
        
    } catch (error) {
        console.error('Error:', error);
        messageEl.innerHTML = `<span class="error-message">오류: ${error.message}</span>`;
        card.classList.remove('generating');
        
        if (window.location.protocol === 'file:' && currentProxyIndex < CORS_PROXIES.length - 1) {
            currentProxyIndex++;
            showToast('다른 프록시로 재시도합니다...', 'info');
        }
    } finally {
        genBtn.disabled = false;
        genBtn.innerHTML = '✨ 메시지 생성';
    }
}

// 전체 메시지 생성
async function generateAllMessages() {
    const apiKey = document.getElementById('apiKey').value;
    
    if (!apiKey) {
        showToast('Groq API Key를 입력해주세요.', 'error');
        return;
    }
    
    if (isGenerating) {
        showToast('이미 생성 중입니다.', 'error');
        return;
    }
    
    isGenerating = true;
    
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const generateAllBtn = document.getElementById('generateAllBtn');
    
    progressBar.style.display = 'block';
    generateAllBtn.disabled = true;
    generateAllBtn.innerHTML = '<span class="loading"></span> 생성 중...';
    
    const ungenerated = studentsData.filter((s, i) => !s.message).length;
    let completed = 0;
    
    for (let i = 0; i < studentsData.length; i++) {
        if (!studentsData[i].message) {
            await generateMessage(i);
            completed++;
            
            const progress = Math.round((completed / ungenerated) * 100);
            progressFill.style.width = `${progress}%`;
            progressText.textContent = `${progress}% (${completed}/${ungenerated})`;
            
            if (completed < ungenerated) {
                await new Promise(resolve => setTimeout(resolve, 2500));
            }
        }
    }
    
    isGenerating = false;
    generateAllBtn.disabled = false;
    generateAllBtn.innerHTML = '✨ 전체 메시지 생성';
    
    showToast('모든 메시지 생성이 완료되었습니다!', 'success');
}

// 메시지 복사
function copyMessage(index) {
    const message = studentsData[index].message;
    
    if (!message) {
        showToast('먼저 메시지를 생성해주세요.', 'error');
        return;
    }
    
    navigator.clipboard.writeText(message).then(() => {
        showToast('메시지가 클립보드에 복사되었습니다!', 'success');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = message;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('메시지가 클립보드에 복사되었습니다!', 'success');
    });
}

// 결과 내보내기
function exportResults() {
    const generated = studentsData.filter(s => s.message).length;
    
    if (generated === 0) {
        showToast('내보낼 메시지가 없습니다.', 'error');
        return;
    }
    
    let content = '# 수료생 격려 메시지\n\n';
    content += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    content += `총 인원: ${studentsData.length}명\n`;
    content += `생성 완료: ${generated}명\n\n`;
    content += '---\n\n';
    
    studentsData.forEach((student, index) => {
        content += `## ${index + 1}. ${student.name}\n\n`;
        content += `| 항목 | 내용 |\n`;
        content += `|------|------|\n`;
        content += `| 센터 | ${student.center || '-'} |\n`;
        content += `| 포지션 | ${student.position || '-'} |\n`;
        content += `| 전공 | ${student.major || '-'} |\n\n`;
        content += `### 매니저의 한마디\n\n`;
        content += `> ${student.message || '(메시지 미생성)'}\n\n`;
        content += '---\n\n';
    });
    
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `수료생_격려메시지_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('파일이 다운로드되었습니다!', 'success');
}

// 이벤트 리스너
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadDataBtn').addEventListener('click', loadData);
    document.getElementById('generateAllBtn').addEventListener('click', generateAllMessages);
    document.getElementById('exportBtn').addEventListener('click', exportResults);
});
