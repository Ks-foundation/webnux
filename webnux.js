// 파일 시스템 객체 생성
let fileSystem = null;
// 현재 디렉토리
let currentDirectory = '';

// 파일 시스템 초기화 함수
function initializeFileSystem() {
    const request = window.indexedDB.open('file_system', 1);

    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        fileSystem = db.createObjectStore('files', { keyPath: 'name' });
    };

    request.onsuccess = function(event) {
        const db = event.target.result;
        fileSystem = db.transaction('files', 'readwrite').objectStore('files');
        currentDirectory = '/';
        displayConsole("$ ");
    };

    request.onerror = function(event) {
        console.error("File system initialization error:", event.target.error);
    };
}

// 파일 추가 함수
function addFile(name, content) {
    const request = fileSystem.add({ name: currentDirectory + name, content: content });

    request.onsuccess = function(event) {
        console.log("File added successfully:", name);
    };

    request.onerror = function(event) {
        console.error("Error adding file:", event.target.error);
    };
}

// 파일 삭제 함수
function deleteFile(name) {
    const request = fileSystem.delete(currentDirectory + name);

    request.onsuccess = function(event) {
        console.log("File deleted successfully:", name);
    };

    request.onerror = function(event) {
        console.error("Error deleting file:", event.target.error);
    };
}

// 파일 실행 함수
function executeFile(name) {
    const transaction = fileSystem.transaction(['files'], 'readonly');
    const objectStore = transaction.objectStore('files');
    const request = objectStore.get(currentDirectory + name);

    request.onsuccess = function(event) {
        const file = event.target.result;
        try {
            eval(file.content); // 파일 내용을 실행
        } catch (error) {
            console.error("Error executing file:", error);
        }
    };

    request.onerror = function(event) {
        console.error("Error executing file:", event.target.error);
    };
}

// 디렉토리 변경 함수
function changeDirectory(path) {
    const request = fileSystem.openCursor();

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const fileName = cursor.value.name;
            if (fileName.startsWith(path) && fileName !== path) {
                currentDirectory = path;
                listFiles();
                return;
            }
            cursor.continue();
        } else {
            console.error("Directory not found:", path);
        }
    };

    request.onerror = function(event) {
        console.error("Error changing directory:", event.target.error);
    };
}

// 파일 내용 편집 함수
function editFile(name, content) {
    const request = fileSystem.put({ name: currentDirectory + name, content: content });

    request.onsuccess = function(event) {
        console.log("File edited successfully:", name);
    };

    request.onerror = function(event) {
        console.error("Error editing file:", event.target.error);
    };
}

// 외부 JavaScript 파일 설치 함수
function installExternalJS(url) {
    fetch(url)
        .then(response => response.text())
        .then(data => {
            const fileName = url.split('/').pop();
            addFile(fileName, data);
        })
        .catch(error => console.error("Error installing external JS file:", error));
}

// 콘솔 출력 함수
function displayConsole(prompt) {
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = prompt;
    inputElement.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const command = inputElement.value.trim();
            processCommand(command);
            inputElement.remove();
            displayConsole("$ ");
        }
    });
    consoleElement.appendChild(inputElement);
    inputElement.focus();
}

// 명령어 처리 함수
function processCommand(command) {
    const args = command.split(" ");
    const action = args[0];
    const arg = args.slice(1).join(" ");

    switch (action) {
        case 'create':
            addFile(arg, '');
            break;
        case 'delete':
            deleteFile(arg);
            break;
        case 'execute':
            executeFile(arg);
            break;
        case 'cd':
            changeDirectory(arg);
            break;
        case 'edit':
            // 사용법: edit [파일명] [내용]
            const fileName = arg.split(" ")[0];
            const content = arg.substring(fileName.length).trim();
            editFile(fileName, content);
            break;
        case 'install':
            installExternalJS(arg);
            break;
        case 'run':
            executeFile(arg);
            break;
        case 'md':
            addFile(arg + "/.keep", ''); // 빈 디렉토리 생성
            break;
        case 'deldir':
            deleteFile(arg + "/.keep"); // 빈 디렉토리 삭제
            break;
        case 'dir':
            listFiles();
            break;
        case 'cls':
            consoleElement.textContent = ''; // 콘솔 내용 지우기
            break;
        case 'color':
            // 사용법: color [색상]
            changeTextColor(arg);
            break;
        default:
            console.log("Command not found:", command);
            break;
    }
}

// 파일 목록 출력 함수
function listFiles() {
    const transaction = fileSystem.transaction(['files'], 'readonly');
    const objectStore = transaction.objectStore('files');
    const request = objectStore.openCursor();

    consoleElement.textContent = ''; // 콘솔 내용 지우기

    request.onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const fileName = cursor.value.name;
            if (fileName.startsWith(currentDirectory)) {
                const fileDisplay = fileName.replace(currentDirectory, '') + (fileName.endsWith('/') ? '/' : ''); // 현재 디렉토리 경로 제거
                consoleElement.appendChild(document.createTextNode(fileDisplay + '\n'));
            }
            cursor.continue();
        }
    };

    request.onerror = function(event) {
        console.error("Error listing files:", event.target.error);
    };
}

// 파일 시스템 초기화
initializeFileSystem();

// 텍스트 색상 변경 함수
function changeTextColor(color) {
    switch (color) {
        case 'red':
            consoleElement.classList.add('color-red');
            break;
        case 'green':
            consoleElement.classList.add('color-green');
            break;
        case 'blue':
            consoleElement.classList.add('color-blue');
            break;
        default:
            console.error("Invalid color:", color);
            break;
    }
}
