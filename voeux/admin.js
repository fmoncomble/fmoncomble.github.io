document.addEventListener('DOMContentLoaded', async () => {
    const authDiv = document.getElementById('auth-div');
    const fileInput = document.getElementById('file-input');
    const eraseBtn = document.getElementById('erase-btn');
    const compileBtn = document.getElementById('compile-btn');
    const courseList = document.getElementById('course-list');
    const courseAddSelect = document.getElementById('course-add-select');
    const filièreSelect2 = document.getElementById('filière-select-2');
    const semestreSelect2 = document.getElementById('semestre-select-2');
    const saveBtn = document.getElementById('save-btn');
    const dispoDiv = document.getElementById('dispos');
    const authDialog = document.getElementById('auth-dialog');
    const authInput = document.getElementById('auth-input');
    const authSaveBtn = document.getElementById('auth-save-btn');

    // Manage authentication
    let token;
    let profFile;
    let courseFile;
    async function checkToken() {
        token = localStorage.getItem('github-token');
        if (token) {
            const res = await fetch(
                'https://api.github.com/repos/fmoncomble/voeux/contents?ref=main',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/vnd.github+json',
                        'Content-Type': 'application/json',
                    },
                }
            );
            if (!res.ok) {
                window.alert(
                    "L'authentification a échoué : vérifiez le jeton d'authentification"
                );
                token = null;
                authDiv.style.display = 'none';
                authDialog.showModal();
                return;
            } else {
                checkVoeuxFile();
                profFile = await getProfFile();
                courseFile = await getCourseFile();
                buildProfList();
                buildCourseAddSelect();
            }
        } else {
            authDiv.style.display = 'none';
            authDialog.showModal();
        }
    }
    checkToken();

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('github-token');
        const fileExist = document.getElementById('file-exist');
        fileExist.style.display = 'none';
        checkToken();
    });

    authSaveBtn.onclick = () => {
        if (!authInput.value) {
            spinner.style.display = 'none';
            return;
        } else {
            token = authInput.value.trim();
            authInput.value = null;
            localStorage.setItem('github-token', token);
            checkToken();
        }
        authDialog.close();
    };
    authInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (!authInput.value) {
                spinner.style.display = 'none';
                return;
            } else {
                token = authInput.value.trim();
                authInput.value = null;
                localStorage.setItem('github-token', token);
                checkToken();
            }
            authDialog.close();
        }
    });
    // Retrieve existing services file
    let voeux;
    let sha;
    let servicesFile = [];
    async function checkVoeuxFile() {
        const url =
            'https://api.github.com/repos/fmoncomble/voeux/contents/services.json?ref=main';
        const token = localStorage.getItem('github-token');
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        });
        const res = await fetch(url, {
            headers: headers,
        });
        if (!res) {
            window.alert('Impossible de récupérer le fichier de services');
            return;
        } else if (res.status === 401) {
            window.alert("Vérifiez votre jeton d'authentification");
            authDialog.showModal();
            return;
        } else if (res.status === 404) {
            const fileExist = document.getElementById('file-exist');
            fileExist.textContent =
                "Aucun fichier de services n'a encore été créé";
            fileExist.style.display = 'block';
        } else if (res && res.ok) {
            authDiv.style.display = 'block';
            const data = await res.json();
            sha = data.sha;
            const binaryString = atob(data.content);
            const binaryLen = binaryString.length;
            const bytes = new Uint8Array(binaryLen);
            for (let i = 0; i < binaryLen; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            const decoder = new TextDecoder('utf-8');
            const fileExist = document.getElementById('file-exist');
            fileExist.style.display = 'block';
            voeux = decoder.decode(bytes);
            servicesFile = JSON.parse(voeux);
            const actionChoiceDiv = document.getElementById('action-choice');
            actionChoiceDiv.style.display = 'block';
            eraseBtn.style.display = 'inline';
            compileBtn.textContent = 'Mettre à jour';
        }
    }

    // Listen to erase button ('Écraser')
    eraseBtn.addEventListener('click', () => {
        const eraseDialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = 'Voulez-vous vraiment écraser le fichier existant ?';
        const yesBtn = document.createElement('button');
        yesBtn.classList.add('wishes-ui', 'reset-btn');
        yesBtn.textContent = 'Oui';
        const noBtn = document.createElement('button');
        noBtn.classList.add('wishes-ui');
        noBtn.textContent = 'Non';
        yesBtn.addEventListener('click', () => {
            servicesFile = [];
            compileWishes();
            eraseDialog.remove();
        });
        noBtn.addEventListener('click', () => {
            eraseDialog.remove();
        });
        eraseDialog.appendChild(div);
        eraseDialog.appendChild(yesBtn);
        eraseDialog.appendChild(noBtn);
        document.body.appendChild(eraseDialog);
        eraseDialog.showModal();
    });

    // Load individual wish files
    let files;
    fileInput.addEventListener('change', () => {
        const fileName = document.getElementById('file-name');
        const fileList = [];
        files = fileInput.files;
        for (let f of files) {
            fileList.push(f.name);
        }
        fileName.textContent = fileList.join(', ');
    });

    function readWishes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                const json = JSON.parse(reader.result);
                resolve(json);
            });
            reader.addEventListener('error', reject);
            reader.readAsText(file);
        });
    }

    // Function to compile services file from individual wish files
    async function compileWishes() {
        if (!files) {
            window.alert(
                'Chargez un ou plusieurs fichiers de vœux individuels'
            );
            return;
        }
        for (let i = 0; i < files.length; i++) {
            const newJson = await readWishes(files[i]);
            const prof = newJson.Name;
            const cours = newJson.Cours;
            const existingProf = servicesFile.find((s) => s.Name === prof);
            if (existingProf) {
                const dialog = document.getElementById('existing-prof-dialog');
                const thisDialog = dialog.cloneNode(true);
                const profIdSpan = thisDialog.querySelector('#prof-id');
                profIdSpan.textContent = prof;
                const addBtn = thisDialog.querySelector('#add-btn');
                const replaceBtn = thisDialog.querySelector('#replace-btn');
                const cancelBtn = thisDialog.querySelector('#cancel-btn');
                addBtn.onclick = () => {
                    cours.forEach((c) => {
                        existingProf.Cours.push(c);
                    });
                    existingProf.Cours.sort(sortByInt);
                    existingProf.Cours.sort(sortBySem);
                    existingProf.Cours.sort(sortByFil);
                    if (i === files.length - 1) {
                        saveBtn.style.display = 'block';
                    }
                    thisDialog.remove();
                };
                replaceBtn.onclick = () => {
                    const index = servicesFile.indexOf(existingProf);
                    servicesFile.splice(index, 1, newJson);
                    if (i === files.length - 1) {
                        saveBtn.style.display = 'block';
                    }
                    thisDialog.remove();
                };
                cancelBtn.onclick = () => {
                    thisDialog.remove();
                };
                document.body.appendChild(thisDialog);
                thisDialog.showModal();
            } else {
                servicesFile.push(newJson);
                servicesFile.sort((a, b) => {
                    const intA = a.Name.split(' ')[1].toLowerCase();
                    const intB = b.Name.split(' ')[1].toLowerCase();
                    if (intA < intB) {
                        return -1;
                    }
                    if (intA > intB) {
                        return 1;
                    }
                    return 0;
                });
                saveBtn.style.display = 'block';
            }
        }
        compileBtn.style.backgroundColor = 'green';
        setTimeout(() => {
            compileBtn.removeAttribute('style');
        }, 1000);
    }

    compileBtn.addEventListener('click', async () => compileWishes());

    // Function to display list of courses
    async function buildCourseList(filière, semestre, prof) {
        const courseItemArray = Array.from(courseList.children);
        for (let i = 1; i < courseItemArray.length; i++) {
            courseItemArray[i].textContent;
            courseItemArray[i].remove();
        }
        const courseItem = document.getElementById('course-item');
        let courses = [];
        for (let s of servicesFile) {
            s.Cours.forEach((c) => {
                copy = JSON.parse(JSON.stringify(c));
                copy.teacher = s.Name;
                courses.push(copy);
            });
        }
        let logic;
        if (filière && semestre) {
            logic = 'course';
            dispoDiv.style.display = 'none';
            courses = courses.filter(
                (c) => c.filière === filière && c.semestre === semestre
            );
        } else if (prof) {
            logic = 'prof';
            courses = courses.filter((c) => c.teacher === prof);
            if (courses.length === 0) {
                const newItem = courseItem.cloneNode(true);
                newItem.textContent = `Aucun enseignement trouvé pour ${prof}`;
                courseList.appendChild(newItem);
                newItem.style.display = 'block';
                dispoDiv.style.display = 'none';
            }
        }

        const courseItems = new Set();
        for (let c of courses) {
            const courseId = `${c.filière} — ${c.semestre} — ${c.intitulé}`;
            let newItem;
            let courseTeachers;
            let reqNb;
            const nbgrp = Number(c.nbgrp);
            if (nbgrp) {
                reqNb = nbgrp;
            } else if (c.format === 'CM' || c.format === 'TD_OPT') {
                reqNb = 1;
            } else if (c.filière === 'LLCER' || c.filière === 'LEA') {
                if (c.semestre === 'S1') {
                    reqNb = 5;
                } else if (c.semestre === 'S2') {
                    reqNb = 4;
                } else if (c.semestre === 'S3' || c.semestre === 'S4') {
                    reqNb = 3;
                } else if (c.semestre === 'S5' || c.semestre === 'S6') {
                    reqNb = 2;
                } else {
                    reqNb = 1;
                }
            } else {
                reqNb = 1;
            }
            const courseNb = courses.filter(
                (i) =>
                    i.filière === c.filière &&
                    i.semestre === c.semestre &&
                    i.intitulé === c.intitulé
            ).length;
            const totalCourseNb = courses.filter(
                (i) =>
                    i.filière === c.filière &&
                    i.semestre === c.semestre &&
                    i.intitulé.split(' (')[0] === c.intitulé.split(' (')[0]
            ).length;
            if (!courseItems.has(courseId)) {
                courseItems.add(courseId);
                newItem = courseItem.cloneNode(true);
                const courseName = newItem.querySelector('span#course-name');
                courseTeachers = newItem.querySelector('span#course-teachers');
                courseName.textContent = `${c.filière.toUpperCase()} — ${
                    c.semestre
                } — ${c.intitulé}`;
                const teacherFirstName =
                    c.teacher.split(' ')[0].split('')[0] + '.';
                const teacherSurname = c.teacher.split(' ')[1];
                courseTeachers.textContent =
                    teacherFirstName + ' ' + teacherSurname;
                const courseNumberSpan =
                    newItem.querySelector('span#course-number');
                courseNumberSpan.textContent = `${courseNb} / ${reqNb}`;
                if (logic === 'course') {
                    if (totalCourseNb < reqNb) {
                        courseNumberSpan.style.color = 'orange';
                    } else if (totalCourseNb === reqNb) {
                        courseNumberSpan.style.color = 'darkgreen';
                    } else if (totalCourseNb > reqNb) {
                        courseNumberSpan.style.color = '#cc0000';
                        courseNumberSpan.textContent += ' ⚠️';
                    }
                }
                if (logic === 'prof') {
                    const courseTeachersSpan = newItem.querySelector(
                        'span#course-teachers-span'
                    );
                    courseTeachersSpan.remove();
                }
                courseList.appendChild(newItem);
                newItem.style.display = 'block';
            } else if (courseItems.has(courseId)) {
                const existingItem = Array.from(courseList.children).find(
                    (item) => {
                        const courseName =
                            item.querySelector('span#course-name').textContent;
                        return (
                            courseName ===
                            `${c.filière} — ${c.semestre} — ${c.intitulé}`
                        );
                    }
                );
                if (logic === 'course') {
                    courseTeachers = existingItem.querySelector(
                        'span#course-teachers'
                    );
                    const teacherFirstName =
                        c.teacher.split(' ')[0].split('')[0] + '.';
                    const teacherSurname = c.teacher.split(' ')[1];
                    courseTeachers.textContent = courseTeachers.textContent +=
                        ', ' + teacherFirstName + ' ' + teacherSurname;
                }
                const courseNumberSpan =
                    existingItem.querySelector('span#course-number');
                courseNumberSpan.textContent = `${courseNb} / ${reqNb}`;
                if (logic === 'course') {
                    if (totalCourseNb < reqNb) {
                        courseNumberSpan.style.color = 'orange';
                    } else if (totalCourseNb === reqNb) {
                        courseNumberSpan.style.color = 'darkgreen';
                    } else if (totalCourseNb > reqNb) {
                        courseNumberSpan.style.color = '#cc0000';
                        courseNumberSpan.textContent += ' ⚠️';
                    }
                }
            }
        }
        if (logic === 'prof') {
            const profFromFile = servicesFile.find((p) => p.Name === prof);
            if (!profFromFile) {
                return;
            }
            const data = computeServiceVol(profFromFile);
            const baseService = data[0];
            const totalService = data[1];
            const serviceDiv = document.createElement('div');
            serviceDiv.style.marginTop = '10px';
            serviceDiv.style.fontWeight = 'bold';
            serviceDiv.textContent = `Total : ${totalService}h TD / ${baseService}`;
            if (totalService > baseService) {
                const nbHc = totalService - baseService;
                serviceDiv.textContent += ` (${nbHc} HC)`;
            }
            if (totalService === baseService) {
                serviceDiv.style.color = 'darkgreen';
            } else if (
                totalService > 2 * baseService ||
                totalService < baseService
            ) {
                serviceDiv.style.color = '#cc0000';
            } else {
                serviceDiv.style.color = 'darkgreen';
            }
            courseList.appendChild(serviceDiv);
            const dispoTable = dispoDiv.querySelector('table');
            const rows = dispoTable.getElementsByTagName('tr');
            const colHeaders = rows[0].getElementsByTagName('th');
            const profDispos = profFromFile.Dispos;
            if (profDispos && profDispos.length > 0) {
                const cells = dispoTable.getElementsByTagName('td');
                for (let c of cells) {
                    c.textContent = '';
                    c.removeAttribute('style');
                }
                for (let d of profDispos) {
                    let rowIndex, colIndex;
                    for (let i = 0; i < rows.length; i++) {
                        const rowHeader = rows[i].getElementsByTagName('th')[0];
                        if (rowHeader && rowHeader.textContent === d.hour) {
                            rowIndex = i;
                            break;
                        }
                    }
                    for (let j = 0; j < colHeaders.length; j++) {
                        if (colHeaders[j].textContent === d.day) {
                            colIndex = j;
                            break;
                        }
                    }
                    const dCell = rows[rowIndex].cells[colIndex];
                    dCell.style.backgroundColor = 'rgb(214, 245, 214)';
                    dCell.textContent = '✅';
                }
                dispoDiv.style.display = 'block';
            } else {
                dispoDiv.style.display = 'none';
            }
        }
    }

    // Logic to save/update services file
    saveBtn.addEventListener('click', async () => {
        const saveSpinner = document.getElementById('save-spinner');
        saveSpinner.style.display = 'inline-block';
        const success = await saveFile(servicesFile);
        saveSpinner.style.display = 'none';
        if (success) {
            saveBtn.style.backgroundColor = 'green';
        }
        setTimeout(() => {
            saveBtn.removeAttribute('style');
        }, 1000);
    });

    async function saveFile(file) {
        const fileString = JSON.stringify(file);
        const encoder = new TextEncoder();
        const utf8Array = encoder.encode(fileString);
        const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
        const url =
            'https://api.github.com/repos/fmoncomble/voeux/contents/services.json';
        const token = localStorage.getItem('github-token');
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify({
            message: 'Updated services',
            content: finalFile,
            sha: sha,
            branch: 'main',
        });
        try {
            const saveRes = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: body,
            });
            if (!saveRes.ok) {
                if (saveRes.status === 401) {
                    window.alert(
                        "Vous devez entrer un jeton d'authentification"
                    );
                    throw new Error(saveRes.message);
                } else if (saveRes.status === 409) {
                    window.alert('Erreur : ' + saveRes.message);
                    throw new Error(saveRes.message);
                }
            } else {
                return true;
            }
        } catch (error) {
            window.alert('Une erreur a été rencontrée : ' + error);
            console.error(error);
        }
    }

    // Handle course selection for checking data
    const filièreSelect = document.getElementById('filière-select');
    const semestreSelect = document.getElementById('semestre-select');
    filièreSelect.addEventListener('change', () => {
        const options = Array.from(filièreSelect.querySelectorAll('option'));
        const optionLevel = options.find((o) => o.value === filièreSelect.value)
            .dataset.level;
        if (optionLevel === 'm') {
            const sOptions =
                semestreSelect.querySelectorAll('option[data-notm]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        } else if (optionLevel === 'a') {
            const sOptions =
                semestreSelect.querySelectorAll('option[data-nota]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        } else {
            semestreSelect.querySelectorAll('option').forEach((o) => {
                o.disabled = false;
            });
        }
    });

    const checkCourseBtn = document.getElementById('check-course-btn');
    checkCourseBtn.addEventListener('click', async () => {
        const filière = filièreSelect.value;
        const semestre = semestreSelect.value;
        buildCourseList(filière, semestre, null);
    });
    const checkProfBtn = document.getElementById('check-prof-btn');
    checkProfBtn.addEventListener('click', () => {
        const prof = profInput.value;
        buildCourseList(null, null, prof);
    });

    // Handle teacher selection
    const profInput = document.getElementById('prof-input');
    const profList = document.getElementById('prof-list');
    async function getProfFile() {
        try {
            const url =
                'https://api.github.com/repos/fmoncomble/voeux/contents/profs.json?ref=main';
            const ghToken = localStorage.getItem('github-token');
            const headers = new Headers({
                Authorization: `Bearer ${ghToken}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            });
            const res = await fetch(url, {
                headers: headers,
            });
            if (!res) {
                console.error('Could not retrieve course file');
                window.alert('Le serveur ne répond pas');
                return;
            } else if (res.status === 401) {
                window.alert("Vérifiez votre jeton d'authentification");
                authDialog.showModal();
            } else if (res && res.ok) {
                const data = await res.json();
                const binaryString = atob(data.content);
                const binaryLen = binaryString.length;
                const bytes = new Uint8Array(binaryLen);
                for (let i = 0; i < binaryLen; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decoder = new TextDecoder('utf-8');
                let contents = decoder.decode(bytes);
                let file = JSON.parse(contents);
                return file;
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    function buildProfList() {
        for (let p of profFile) {
            let pName = p.name;
            const option = document.createElement('option');
            option.value = pName;
            profList.appendChild(option);
        }
    }

    // Handle course selection for modifying teacher service
    async function getCourseFile() {
        try {
            const url =
                'https://api.github.com/repos/fmoncomble/voeux/contents/cours.json?ref=main';
            const ghToken = localStorage.getItem('github-token');
            const headers = new Headers({
                Authorization: `Bearer ${ghToken}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            });
            const res = await fetch(url, {
                headers: headers,
            });
            if (!res) {
                console.error('Could not retrieve course file');
                window.alert('Le serveur ne répond pas');
                return;
            } else if (res.status === 401) {
                window.alert("Vérifiez votre jeton d'authentification");
                authDialog.showModal();
            } else if (res && res.ok) {
                const data = await res.json();
                const binaryString = atob(data.content);
                const binaryLen = binaryString.length;
                const bytes = new Uint8Array(binaryLen);
                for (let i = 0; i < binaryLen; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const decoder = new TextDecoder('utf-8');
                let contents = decoder.decode(bytes);
                let file = JSON.parse(contents);
                return file;
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    function buildCourseAddSelect() {
        const options = Array.from(courseAddSelect.querySelectorAll('option'));
        for (o of options) {
            o.remove();
        }
        const filière = filièreSelect2.value;
        const semestre = semestreSelect2.value;
        const courses = courseFile.filter(
            (c) => c.filière === filière && c.semestre === semestre
        );
        for (c of courses) {
            const option = document.createElement('option');
            option.value = c.intitulé;
            option.textContent = c.intitulé;
            courseAddSelect.appendChild(option);
        }
    }
    semestreSelect2.addEventListener('change', () => {
        buildCourseAddSelect();
    });
    filièreSelect2.addEventListener('change', () => {
        buildCourseAddSelect();
    });

    const profInput2 = document.getElementById('prof-input-2');
    const goProfBtn = document.getElementById('go-prof-btn');
    goProfBtn.addEventListener('click', () => {
        const ensModDiv = document.getElementById('ens-modify');
        const ensModSpan = document.getElementById('ens-modify-name');
        ensModSpan.textContent = profInput2.value;
        ensModDiv.style.display = 'block';
        buildCourseDeleteSelect();
    });
    const filièreSelect3 = document.getElementById('filière-select-3');
    const semestreSelect3 = document.getElementById('semestre-select-3');
    const courseDeleteSelect = document.getElementById('course-delete-select');
    function buildCourseDeleteSelect() {
        const options = Array.from(
            courseDeleteSelect.querySelectorAll('option')
        );
        for (o of options) {
            o.remove();
        }
        const prof = profInput2.value;
        const filière = filièreSelect3.value;
        const semestre = semestreSelect3.value;
        const profEntry = servicesFile.find((p) => p.Name === prof);
        if (!profEntry) {
            const profToAdd = profFile.find((p) => p.name === prof);
            if (!profToAdd) {
                window.alert(
                    "Enseignant·e inconnu·e : ajoutez-le·a au fichier d'abord"
                );
                return;
            }
            const newProf = {
                Name: profToAdd.name,
                Cours: [],
            };
            servicesFile.push(newProf);
            servicesFile.sort((a, b) => {
                const intA = a.Name.split(' ')[1].toLowerCase();
                const intB = b.Name.split(' ')[1].toLowerCase();
                if (intA < intB) {
                    return -1;
                }
                if (intA > intB) {
                    return 1;
                }
                return 0;
            });
            buildCourseDeleteSelect();
        } else {
            const courses = profEntry.Cours.filter(
                (c) => c.filière === filière && c.semestre === semestre
            );
            for (c of courses) {
                const option = document.createElement('option');
                option.value = c.intitulé;
                option.textContent = c.intitulé;
                courseDeleteSelect.appendChild(option);
            }
        }
    }
    semestreSelect3.addEventListener('change', () => {
        buildCourseDeleteSelect();
    });

    // Manage course add and delete
    const courseAddBtn = document.getElementById('course-add-btn');
    courseAddBtn.addEventListener('click', () => {
        addCourse();
    });
    function addCourse() {
        const prof = profInput2.value;
        if (!prof) {
            window.alert('Sélectionner un·e enseignant·e');
            profInput2.focus();
            return;
        }
        const filière = filièreSelect2.value;
        const semestre = semestreSelect2.value;
        const courseName = courseAddSelect.value;
        const courseToAdd = courseFile.find(
            (c) =>
                c.intitulé === courseName &&
                c.filière === filière &&
                c.semestre === semestre
        );
        const customVolInput = document.getElementById('custom-vol');
        const customVol = customVolInput.value;
        let customCourseToAdd;
        if (customVol) {
            customCourseToAdd = {};
            customCourseToAdd.intitulé = courseToAdd.intitulé;
            customCourseToAdd.filière = courseToAdd.filière;
            customCourseToAdd.semestre = courseToAdd.semestre;
            customCourseToAdd.format = courseToAdd.format;
            customCourseToAdd.volume = Number(customVol);
            if (customCourseToAdd.format === 'CM') {
                customCourseToAdd.eqtd = customVol * 1.5;
            } else if (customCourseToAdd.format === 'TP') {
                customCourseToAdd.eqtd = customVol / 1.5;
            } else {
                customCourseToAdd.eqtd = Number(customVol);
            }
            customCourseToAdd.intitulé += ` (${customVol}h)`;
        }
        const profEntry = servicesFile.find((p) => p.Name === prof);
        const courses = profEntry.Cours;
        if (customCourseToAdd) {
            courses.push(customCourseToAdd);
        } else {
            courses.push(courseToAdd);
        }
        courses.sort(sortByInt);
        courses.sort(sortBySem);
        courses.sort(sortByFil);
        buildCourseDeleteSelect();
        const courseAddDiv = document.getElementById('course-add-div');
        const courseAddSpan = document.getElementById('course-add-span');
        const data = computeServiceVol(profEntry);
        const baseService = data[0];
        const totalService = data[1];
        courseAddSpan.textContent = `${filière.toUpperCase()} ${semestre} ${courseName}`;
        if (customVol) {
            courseAddSpan.textContent += ` (${customVol}h)`;
        }
        courseAddSpan.textContent += ` a été ajouté au service de ${prof}. Total : ${totalService} sur ${baseService}`;
        courseAddDiv.style.display = 'block';
        customVolInput.value = '';
    }

    const courseDeleteBtn = document.getElementById('course-delete-btn');
    courseDeleteBtn.addEventListener('click', () => {
        deleteCourse();
    });
    function deleteCourse() {
        const prof = profInput2.value;
        if (!prof) {
            window.alert('Sélectionner un·e enseignant·e');
            profInput2.focus();
            return;
        }
        const filière = filièreSelect3.value;
        const semestre = semestreSelect3.value;
        const courseName = courseDeleteSelect.value;
        const profEntry = servicesFile.find((p) => p.Name === prof);
        const courses = profEntry.Cours;
        const courseToDelete = courses.find(
            (c) =>
                c.intitulé === courseName &&
                c.filière === filière &&
                c.semestre === semestre
        );
        const index = courses.indexOf(courseToDelete);
        courses.splice(index, 1);
        buildCourseDeleteSelect();
        const courseDeleteDiv = document.getElementById('course-delete-div');
        const courseDeleteSpan = document.getElementById('course-delete-span');
        const data = computeServiceVol(profEntry);
        const baseService = data[0];
        const totalService = data[1];
        courseDeleteSpan.textContent = `${filière.toUpperCase()} ${semestre} ${courseName} a été supprimé du service de ${prof}. Total : ${totalService} sur ${baseService}`;
        courseDeleteDiv.style.display = 'block';
    }

    // Calculer service total et service dû
    function computeServiceVol(prof) {
        if (!prof) {
            return;
        }
        const profFromFile = profFile.find((p) => p.name === prof.Name);
        let baseService = profFromFile.service;
        if (!baseService) {
            const profStatus = profFromFile.status;
            if (
                profStatus === 'PR' ||
                profStatus === 'MCF' ||
                profStatus === 'ATER'
            ) {
                baseService = 192;
            } else if (profStatus === 'PRAG' || profStatus === 'PRCE') {
                baseService = 384;
            } else if (profStatus === 'LECT') {
                baseService = 200;
            } else if (profStatus === 'VAC') {
                baseService = Infinity;
            } else {
                baseService = profFromFile.service;
            }
        }
        let totalService = 0;
        for (c of prof.Cours) {
            totalService += Number(c.eqtd);
        }
        totalService = Number(totalService);
        return [baseService, totalService];
    }

    const saveChangesBtn = document.getElementById('save-changes-btn');
    saveChangesBtn.addEventListener('click', async () => {
        const saveChgSpinner = document.getElementById('save-chg-spinner');
        saveChgSpinner.style.display = 'inline-block';
        const success = await saveFile(servicesFile);
        saveChgSpinner.style.display = 'none';
        if (success) {
            saveChangesBtn.style.backgroundColor = 'green';
        }
        setTimeout(() => {
            saveChangesBtn.removeAttribute('style');
        }, 1000);
        saveChgSpinner.style.display = 'none';
    });

    // Course sorting functions
    function sortByFil(a, b) {
        const filA = a.filière.toLowerCase();
        const filB = b.filière.toLowerCase();
        if (filA < filB) {
            return -1;
        }
        if (filA > filB) {
            return 1;
        }
        return 0;
    }
    function sortBySem(a, b) {
        const semA = a.semestre.toLowerCase();
        const semB = b.semestre.toLowerCase();
        if (semA < semB) {
            return -1;
        }
        if (semA > semB) {
            return 1;
        }
        return 0;
    }
    function sortByInt(a, b) {
        const intA = a.intitulé.toLowerCase();
        const intB = b.intitulé.toLowerCase();
        if (intA < intB) {
            return -1;
        }
        if (intA > intB) {
            return 1;
        }
        return 0;
    }

    // Function to flatten servicesFile
    function flattenJson() {
        return new Promise((resolve, reject) => {
            try {
                const jsonForXls = [];
                for (let s of servicesFile) {
                    const teacherName = s.Name;
                    const teacherCourses = s.Cours;
                    for (let c of teacherCourses) {
                        const course = {};
                        course.teacher = teacherName;
                        course.filière = c.filière;
                        course.semestre = c.semestre;
                        course.format = c.format;
                        course.intitulé = c.intitulé;
                        course.volume = Number(c.volume);
                        course.eqtd = Number(c.eqtd);
                        jsonForXls.push(course);
                    }
                }
                resolve(jsonForXls);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to generate and download XLSX file from flattened file
    async function makeXlsx() {
        const json = await flattenJson();
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(json);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');
        XLSX.writeFile(workbook, 'Services.xlsx');
    }
    const exportBtn = document.getElementById('export-btn');
    exportBtn.onclick = async () => {
        await makeXlsx();
    };
});
