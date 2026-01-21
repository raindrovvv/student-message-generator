// 전역 변수
let studentsData = [];
let isGenerating = false;

// CORS 프록시 URL (여러 옵션)
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

// Groq API로 메시지 생성 (CORS 프록시 사용)
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
        warm: '따뜻하고 친근한 말투로, 가족처럼 정감있게',
        professional: '전문적이고 격식있는 말투로, 공식적인 축하 메시지처럼',
        energetic: '에너지 넘치고 열정적인 말투로, 파이팅을 불어넣듯이',
        mentoring: '선배 멘토가 후배에게 조언하듯 따뜻하지만 진지하게'
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
- MBTI: ${student.mbti || '모름'}

## 메시지 스타일
${styleGuide[style]}

## 작성 가이드
1. 이름을 언급하며 시작하세요
2. 수강생의 특성(전공, 포지션, MBTI 등)을 자연스럽게 반영한 개인화된 내용을 포함하세요
3. 교육 과정 동안의 성장과 노력을 인정해주세요
4. 앞으로의 게임 개발자로서의 여정을 응원해주세요
5. 3~4문장 정도의 길이로 작성하세요
6. 한국어로 작성하세요

메시지만 작성해주세요.`;

    const messageEl = document.getElementById(`message-${index}`);
    const genBtn = document.getElementById(`genBtn-${index}`);
    const card = document.getElementById(`student-${index}`);
    
    messageEl.innerHTML = '<span class="loading"></span> 메시지 생성 중...';
    genBtn.disabled = true;
    genBtn.innerHTML = '<span class="loading"></span> 생성 중...';
    card.classList.add('generating');
    card.classList.remove('generated');
    
    try {
        // CORS 프록시를 통해 요청
        const targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
        const proxyUrl = CORS_PROXIES[currentProxyIndex] + encodeURIComponent(targetUrl);
        
        const response = await fetch(proxyUrl, {
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
                max_tokens: 1024,
                temperature: 0.8
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
        const message = data.choices[0].message.content;
        
        studentsData[index].message = message;
        messageEl.innerHTML = message;
        card.classList.remove('generating');
        card.classList.add('generated');
        
    } catch (error) {
        console.error('Error:', error);
        messageEl.innerHTML = `<span class="error-message">오류: ${error.message}</span>`;
        card.classList.remove('generating');
        
        // 다른 프록시 시도
        if (currentProxyIndex < CORS_PROXIES.length - 1) {
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
    
    let content = '# 🎓 수료생 격려 메시지\n\n';
    content += `📅 생성일: ${new Date().toLocaleDateString('ko-KR')}\n`;
    content += `👥 총 인원: ${studentsData.length}명\n`;
    content += `✅ 생성 완료: ${generated}명\n\n`;
    content += '---\n\n';
    
    studentsData.forEach((student, index) => {
        content += `## ${index + 1}. ${student.name}\n\n`;
        content += `| 항목 | 내용 |\n`;
        content += `|------|------|\n`;
        content += `| 센터 | ${student.center || '-'} |\n`;
        content += `| 포지션 | ${student.position || '-'} |\n`;
        content += `| 전공 | ${student.major || '-'} |\n`;
        content += `| MBTI | ${student.mbti || '-'} |\n\n`;
        content += `### 💌 매니저의 한마디\n\n`;
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