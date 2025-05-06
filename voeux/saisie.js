document.addEventListener('DOMContentLoaded', async () => {
    const tokenInput = document.getElementById('token-input');
    const authSaveBtn = document.getElementById('auth-save');
    const teacherInputDiv = document.getElementById('teacher-input-div');
    const teacherInput = document.getElementById('teacher-name');
    const goBtn = document.getElementById('go-btn');
    const teacherStatus = document.getElementById('teacher-status');
    const teacherService = document.getElementById('teacher-service');
    const fileLoadDiv = document.getElementById('file-load');
    const fileLoadBtn = document.getElementById('file-load-btn');
    const fileInput = document.getElementById('file-input');
    const courseChoiceDiv = document.getElementById('class-choice');
    const filièreInput = document.getElementById('filière');
    const semestreInput = document.getElementById('semestre');
    const courseInput = document.getElementById('cours');
    const courseInfo = document.getElementById('course-info');
    const saveDiv = document.getElementById('save');
    const saveBtn = document.getElementById('save-btn');
    const addedCourses = document.getElementById('added-courses');
    const addedCoursesList = document.getElementById('added-courses-list');
    const sendBtn = document.getElementById('send-btn');
    const hTotal = document.getElementById('hTotal');
    const hc = document.getElementById('hc');
    const table = document.querySelector('table');
    const tableCells = Array.from(document.querySelectorAll('td'));
    const dispoCheck = document.querySelector('input#dispo-check');
    let noIndispo = true;
    let isGliding = false;
    const remarksTextArea = document.getElementById('remarks');
    remarksTextArea.value = null;

    const instrDiv = document.getElementById('instructions');
    const firstTimeDialog = document.getElementById('first-time');
    const okBtn = firstTimeDialog.querySelector('button#ok-btn');
    okBtn.addEventListener('click', () => {
        firstTimeDialog.close();
        teacherInput.focus();
    });
    const instrDialog = document.getElementById('instructions-dialog');
    instrDiv.addEventListener('click', () => {
        instrDialog.showModal();
    });

    const footer = document.querySelector('.footer');
    footer.textContent += `-${new Date().getFullYear()}`;

    // Get dropbox token
    let dropboxToken;
    async function getDropboxToken() {
        const form = new FormData();
        form.append('action', 'get_token');
        // const res = await fetch('dropbox.php', {
        //     method: 'POST',
        //     body: form,
        // });
        const res = await fetch(
            'https://prendrelangue.fr/wp-content/uploads/voeux/dropbox.php',
            {
                method: 'POST',
                body: form,
            }
        );
        if (res.ok) {
            let data = await res.json();
            if (data.success) {
                let message = data.message;
                let token = message.access_token;
                return token;
            } else {
                console.error('Error getting Dropbox token', data.message);
                return null;
            }
        } else {
            console.error('PHP error');
            return null;
        }
    }

    // Function to handle instructions
    let understand = sessionStorage.getItem('understand');
    const comprisBtn = instrDialog.querySelector('#compris');
    comprisBtn.addEventListener('click', () => {
        if (!understand) {
            understand = true;
        }
        sessionStorage.setItem('understand', understand);
        instrDialog.close();
    });

    // Manage authentication & get data
    authSaveBtn.addEventListener('click', () => saveToken());
    tokenInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveToken();
        }
    });
    let token;
    let teacherData;
    let courseData;
    const teacherDBUrl =
        'https://api.github.com/repos/fmoncomble/voeux/contents/profs.json?ref=main';
    const courseDBUrl =
        'https://api.github.com/repos/fmoncomble/voeux/contents/cours.json?ref=main';

    async function checkToken() {
        token = sessionStorage.getItem('saisie-github-token');
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
                return;
            } else {
                tokenInput.disabled = true;
                tokenInput.type = 'text';
                tokenInput.value = 'Authentification OK ✅';
                tokenInput.style.fontWeight = 'bold';
                tokenInput.style.outline = 'solid 1px green';
                authSaveBtn.textContent = 'Déconnecter';
                authSaveBtn.classList.add('reset-btn');
                teacherInputDiv.style.display = 'block';
                if (!teacherData && !courseData) {
                    teacherData = await getFile(teacherDBUrl);
                    courseData = await getFile(courseDBUrl);
                    if (teacherData && courseData) {
                        buildTeacherList();
                        buildCourseList();
                    }
                }
                teacherInput.focus();
            }
            if (!understand) {
                firstTimeDialog.showModal();
            }
            window.onbeforeunload = saveToken;
        } else {
            tokenInput.placeholder = "Jeton d'authentification";
            tokenInput.removeAttribute('style');
            tokenInput.type = 'password';
            tokenInput.disabled = false;
            authSaveBtn.textContent = 'Enregistrer';
            authSaveBtn.classList.remove('reset-btn');
            tokenInput.value = null;
            teacherInputDiv.style.display = 'none';
            tokenInput.focus();
        }
    }
    checkToken();
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!token && tokenParam) {
        tokenInput.value = tokenParam;
        await saveToken();
        window.location.replace(
            'https://fmoncomble.github.io/voeux/saisie.html'
        );
        // window.location.replace('http://localhost:8000/voeux/saisie.html');
    }
    async function saveToken() {
        if (tokenInput.value && !token) {
            sessionStorage.setItem(
                'saisie-github-token',
                tokenInput.value.trim()
            );
            checkToken();
        } else if (token) {
            sessionStorage.removeItem('saisie-github-token');
            token = null;
            tokenInput.removeAttribute('style');
            tokenInput.type = 'password';
            tokenInput.disabled = false;
            tokenInput.value = null;
            authSaveBtn.textContent = 'Enregistrer';
            authSaveBtn.classList.remove('reset-btn');
            tokenInput.placeholder = "Jeton d'authentification";
            teacherInput.value = null;
            teacherInput.disabled = false;
            teacherStatus.textContent = null;
            teacherService.textContent = null;
            goBtn.textContent = 'Commencer';
            fileLoadBtn.disabled = false;
            remarksTextArea.value = null;
            const container1 = document.getElementById('container-1');
            const divs = Array.from(container1.children);
            for (let div of divs) {
                if (divs.indexOf(div) > 0) {
                    div.style.display = 'none';
                }
            }
            const container2 = document.getElementById('container-2');
            container2.style.display = 'none';
            teacherInputDiv.style.display = 'none';
            window.location.reload();
        }
    }

    // Get profs and cours files
    async function getFile(url) {
        try {
            const token = sessionStorage.getItem('saisie-github-token');
            const headers = new Headers({
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            });
            const res = await fetch(url, {
                headers: headers,
            });
            if (res && res.ok) {
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
            console.error(error);
        }
    }

    function buildTeacherList() {
        const teacherList = document.getElementById('teacher-list');
        for (let t of teacherData) {
            let tName = t.name;
            const option = document.createElement('option');
            option.value = tName;
            teacherList.appendChild(option);
        }
    }

    let tName;
    let tService;
    let tHc;
    let filière = 'LLCER';
    let semestre = 'S1';

    let jsonFile = {};

    // Initialize inputs
    const inputs = Array.from(document.querySelectorAll('input'));
    inputs.forEach((input) => {
        input.value = '';
        if (input.id !== 'file-input') {
            input.removeAttribute('style');
        }
        if (input.type === 'checkbox') {
            input.checked = true;
        }
    });

    goBtn.onclick = start;
    teacherInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            start();
        }
    });

    async function start() {
        goBtn.onclick = () => window.location.reload();
        if (!understand) {
            instrDialog.showModal();
        }
        if (!teacherInput.value) {
            window.alert('Entrez votre nom');
            teacherInput.focus();
            return;
        }
        const teachers = new Set();
        for (t of teacherData) {
            teachers.add(t.name);
        }
        if (!teachers.has(teacherInput.value)) {
            window.alert(
                'Le nom saisi ne fait pas partie de la liste.\nContactez Florent Moncomble et Guillaume Winter pour vous ajouter'
            );
            return;
        }
        teacherInput.disabled = true;
        tName = teacherInput.value;
        // Check if teacher already has file
        let checkAttempts = 0;
        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        goBtn.innerHTML = null;
        goBtn.appendChild(spinner);
        const exist = await checkFile();
        async function checkFile() {
            dropboxToken = await getDropboxToken();
            checkAttempts++;
            const date = new Date().toISOString().split('-')[0];
            let query = `${tName}_${date}`;
            let formData = new FormData();
            formData.append('query', query);
            formData.append('action', 'check');
            formData.append('token', dropboxToken);
            // const res = await fetch('dropbox.php', {
            //     method: 'POST',
            //     body: formData,
            // });
            let res = await fetch(
                'https://prendrelangue.fr/wp-content/uploads/voeux/dropbox.php',
                {
                    method: 'POST',
                    body: formData,
                }
            );
            if (res.ok) {
                const data = await res.json();
                if (!data.success) {
                    if (data.status === 401) {
                        if (checkAttempts < 4) {
                            dropboxToken = await getDropboxToken();
                            checkFile();
                            return;
                        } else {
                            console.error(
                                'Could not authenticate',
                                data.message
                            );
                            spinner.remove();
                            goBtn.textContent = 'Changer';
                            return false;
                        }
                    } else {
                        console.error('Error checking for file', data.message);
                        spinner.remove();
                        goBtn.textContent = 'Changer';
                        return false;
                    }
                } else {
                    if (data.message === 'File not found') {
                        spinner.remove();
                        goBtn.textContent = 'Changer';
                        return false;
                    } else {
                        spinner.remove();
                        goBtn.textContent = 'Changer';
                        return true;
                    }
                }
            } else {
                console.error('PHP error');
                spinner.remove();
                goBtn.textContent = 'Changer';
                return false;
            }
        }
        if (exist) {
            let overwrite = window.confirm(
                'Vous avez déjà envoyé vos vœux.\nSouhaitez-vous les remplacer ?'
            );
            if (!overwrite) {
                teacherInput.value = null;
                return;
            }
        }
        const dispoContainer = document.getElementById('container-2');
        dispoContainer.style.display = 'block';
        jsonFile = null;
        const addedCourses = document.getElementById('added-courses');
        addedCourses.style.display = 'none';
        saveBtn.style.display = 'none';
        const tStatus = teacherData.find((t) => t.name === tName).status;
        if (tStatus) {
            teacherStatus.textContent = `Statut : ${tStatus}`;
        }
        const customService = teacherData.find((t) => t.name === tName).service;
        if (customService) {
            tService = customService;
        } else {
            if (tStatus === 'MCF' || tStatus === 'PR' || tStatus === 'ATER') {
                tService = 192;
            } else if (tStatus === 'PRAG/PRCE') {
                tService = 384;
            } else if (tStatus === 'LECT') {
                tService = 200;
            } else if (tStatus === 'VAC') {
                tService = Infinity;
            } else {
                tService = teacherData.find((t) => t.name === tName).service;
            }
        }
        if (tService) {
            if (tService === Infinity) {
                teacherService.textContent = null;
            } else {
                teacherService.textContent = `Service statutaire : ${tService} heures éq. TD`;
            }
        }
        const customHc = teacherData.find((t) => t.name === tName).hc;
        if (customHc) {
            tHc = customHc;
            teacherService.textContent += ` (${tHc} HC max)`;
        }
        fileLoadDiv.style.display = 'block';
        filièreInput.value = 'LLCER';
        filière = 'LLCER';
        semestreInput.value = 'S1';
        semestre = 'S1';
        buildCourseList();
        courseChoiceDiv.style.display = 'block';
    }

    // Load existing file
    fileLoadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const contents = e.target.result;
                let loadedFile = JSON.parse(contents);
                if (loadedFile.Name !== tName) {
                    window.alert('Le fichier n’est pas à votre nom.');
                    return;
                }
                let cours = loadedFile.Cours;
                if (cours && cours.length) {
                    const courseItems = Array.from(addedCoursesList.children);
                    for (cI of courseItems) {
                        if (cI.id !== 'added-course-item-template') {
                            cI.remove();
                        }
                    }
                    if (jsonFile && jsonFile.Cours) {
                        jsonFile.Cours = [];
                    }
                    for (let c of cours) {
                        if (
                            !jsonFile ||
                            !jsonFile.Cours.find((cours) => cours.id === c.id)
                        ) {
                            let value = loadedFile.Cours.filter(
                                (cours) => cours.id === c.id
                            ).length;
                            await saveCourse(c, value, 'file');
                            adjustEntries(c, value);
                        }
                    }
                }
                let remarques = loadedFile.Remarques;
                if (remarques) {
                    remarksTextArea.value = remarques;
                    jsonFile.Remarques = remarques;
                }
                let indispos = loadedFile.Dispos;
                if (indispos && indispos.length) {
                    const rows = table.getElementsByTagName('tr');
                    const colHeaders = rows[0].getElementsByTagName('th');
                    for (let c of tableCells) {
                        c.textContent = '';
                        c.removeAttribute('style');
                    }
                    if (jsonFile && jsonFile.Dispos) {
                        jsonFile.Dispos = [];
                    }
                    for (let d of indispos) {
                        let rowIndex, colIndex;
                        for (let i = 0; i < rows.length; i++) {
                            const rowHeader =
                                rows[i].getElementsByTagName('th')[0];
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
                        select(dCell, d.day, d.hour);
                    }
                } else {
                    for (let c of tableCells) {
                        c.textContent = null;
                        c.removeAttribute('style');
                    }
                    dispoCheck.checked = true;
                }
                fileLoadBtn.disabled = true;
            };
            reader.readAsText(file);
        }
    });

    // Limit available semester options according to filière
    filièreInput.addEventListener('change', () => {
        const meefWarning = document.getElementById('meef-warning');
        if (filièreInput.value === 'MEEF') {
            meefWarning.style.display = 'inline-block';
        } else {
            meefWarning.style.display = 'none';
        }
        semestreInput.value = 'S1';
        filière = filièreInput.value;
        semestre = semestreInput.value;
        const options = Array.from(filièreInput.querySelectorAll('option'));
        const optionLevel = options.find((o) => o.value === filièreInput.value)
            .dataset.level;
        semestreInput.querySelectorAll('option').forEach((o) => {
            o.disabled = false;
        });
        if (optionLevel === 'm') {
            const sOptions =
                semestreInput.querySelectorAll('option[data-notm]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        } else if (optionLevel === 'a') {
            const sOptions =
                semestreInput.querySelectorAll('option[data-nota]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        }
        buildCourseList();
    });

    semestreInput.addEventListener('change', () => {
        courseInput.value = '';
        semestre = semestreInput.value;
        buildCourseList();
    });

    function buildCourseList() {
        const courseOptions = Array.from(
            courseInput.querySelectorAll('option')
        );
        for (let co of courseOptions) {
            co.remove();
        }
        const option1 = document.createElement('option');
        option1.textContent = '—';
        option1.value = '';
        option1.disabled = true;
        option1.selected = true;
        courseInput.appendChild(option1);
        const courseChoiceList = courseData.filter(
            (c) => c.filière === filière && c.semestre === semestre
        );
        for (let c of courseChoiceList) {
            const option = document.createElement('option');
            option.value = c.intitulé;
            option.textContent = c.intitulé;
            option.id = c.id;
            courseInput.appendChild(option);
        }
    }

    courseInput.addEventListener('change', () => {
        const cName = courseInput.value;
        const course = courseData.find(
            (c) =>
                c.intitulé === cName &&
                c.semestre === semestre &&
                c.filière === filière
        );
        courseInfo.textContent = `${filière} — ${semestre} — ${cName} : ${course.volume}h ${course.format}`;
        if (course.format !== 'TD') {
            courseInfo.textContent += ` = ${course.eqtd}h éq. TD`;
        }
        courseInfo.style.display = 'inline';
        saveBtn.style.display = 'inline';
        saveBtn.onclick = () => saveCourse(course);
    });

    let i = 1;
    let volTotal = new Number();
    let volHc = new Number();

    async function saveCourse(course, value, mode) {
        if (!course) {
            return;
        }
        if (!tName) {
            window.alert('Entrez votre nom');
            teacherInput.focus();
            return;
        }
        if (!jsonFile) {
            jsonFile = {};
            jsonFile.Name = tName;
            jsonFile.Cours = [];
            jsonFile.Cours.push(course);
        } else if (jsonFile && !jsonFile.Cours) {
            jsonFile.Cours = [];
            jsonFile.Cours.push(course);
        } else if (jsonFile) {
            jsonFile.Cours.push(course);
        }
        saveBtn.style.backgroundColor = 'green';
        addedCourses.style.display = 'block';
        addedCoursesList.style.display = 'block';
        const courseItem = document.getElementById(
            'added-course-item-template'
        );
        const entry = courseItem.cloneNode(true);
        entry.id = `entry${i}`;
        entry.setAttribute('course-id', course.id);
        const entryInfo = entry.querySelector('div.added-course-item-info');
        entryInfo.textContent = `${course.filière} — ${course.semestre} — ${course.intitulé} : ${course.volume}h ${course.format}`;
        if (course.format !== 'TD') {
            entryInfo.textContent += ` = ${course.eqtd}h éq. TD`;
        }
        const entryNb = entry.querySelector('input.added-course-item-nb');
        entryNb.max = course.nbgrp;
        entryNb.value = 1;
        entryNb.addEventListener('change', () => {
            const value = entryNb.value;
            if (value > course.nbgrp) {
                window.alert(
                    `Le nombre de groupes maximum pour ce cours est ${course.nbgrp}`
                );
                entryNb.value = course.nbgrp;
            }
            adjustEntries(course, value);
        });
        if (value) {
            entryNb.value = value;
        }
        const deleteBtn = entry.querySelector('button.delete-btn');
        deleteBtn.onclick = () => deleteEntry(course, entry);
        entry.style.display = 'flex';
        entry.style.backgroundColor = 'rgb(214, 245, 214)';
        updateVol();
        const firstChild = addedCoursesList.firstChild;
        addedCoursesList.insertBefore(entry, firstChild);
        if (!mode) {
            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 600);
            });
        }
        updateDisplay();
        resetForm();
        checkData();
        i++;
    }

    function updateVol() {
        volTotal = 0;
        for (let c of jsonFile.Cours) {
            const cVol = Number(c.eqtd);
            volTotal += cVol;
            volTotal = Number(parseFloat(Number(volTotal).toFixed(2)));
        }
        hTotal.textContent = volTotal + ' hTD';
        if (volTotal >= tService) {
            hTotal.style.color = 'green';
            if (volTotal > tService) {
                volHc = Number(
                    parseFloat((volTotal - Number(tService)).toFixed(2))
                );
                hc.textContent = `, ${volHc} HC`;
                hc.style.color = 'green';
            }
        }
        if ((tHc && volHc > tHc) || volHc > tService) {
            hc.style.color = 'red';
            hTotal.style.color = 'red';
        }
        if (volTotal < tService) {
            hc.textContent = null;
            hTotal.style.color = '#e69500';
        }
        if (tService === Infinity) {
            hTotal.style.color = 'black';
        }
    }

    async function deleteEntry(course, entry) {
        const existingCourses = jsonFile.Cours.filter(
            (c) => c.id === course.id
        );
        for (let existingCourse of existingCourses) {
            const c = jsonFile.Cours.indexOf(existingCourse);
            jsonFile.Cours.splice(c, 1);
        }
        updateVol();
        entry.style.backgroundColor = '#ffe6e6';
        await new Promise((resolve) => {
            setTimeout(() => {
                entry.remove();
                updateDisplay();
                resolve();
            }, 600);
        });
        checkData();
    }

    function adjustEntries(course, value, entry) {
        const existingCourses = jsonFile.Cours.filter(
            (c) => c.id === course.id
        );
        for (let existingCourse of existingCourses) {
            const c = jsonFile.Cours.indexOf(existingCourse);
            jsonFile.Cours.splice(c, 1);
        }
        for (let i = 0; i < value; i++) {
            jsonFile.Cours.push(course);
        }
        if (entry) {
            const entryNb = entry.querySelector('input.added-course-item-nb');
            entryNb.value = value;
        }
        updateVol();
        checkData();
        i++;
    }

    function updateDisplay() {
        const entries = Array.from(
            document.querySelectorAll('div.added-course-item')
        ).filter((e) => e.id !== 'added-course-item-template');
        if (entries.length === 0) {
            const addedCourses = document.getElementById('added-courses');
            addedCourses.style.display = 'none'; // Hide course list
        } else {
            // Alternate background colors
            for (let e of entries) {
                if (e.nextElementSibling.style.backgroundColor === 'white') {
                    e.style.backgroundColor = '#eee';
                } else {
                    e.style.backgroundColor = 'white';
                }
            }
        }
        const courseOptions = Array.from(
            courseInput.querySelectorAll('option')
        );
        for (let o of courseOptions) {
            let existingOption = entries.find((e) => {
                return e.getAttribute('course-id') === o.id;
            });
            if (existingOption) {
                o.disabled = true; // Disable option if course already listed
            } else if (o.textContent !== '—') {
                o.disabled = false;
            }
        }
    }

    function resetForm() {
        courseInfo.textContent = null;
        courseInfo.style.display = 'none';
        courseInput.value = courseInput.querySelector('option[value=""]').value;
        saveBtn.removeAttribute('style');
        saveBtn.style.display = 'none';
    }

    let remarks = remarksTextArea.value;

    const confirmDialog = document.getElementById('confirm-dialog');
    const dlBtn = document.getElementById('dl-btn');
    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');
    sendBtn.onclick = () => {
        if (
            !jsonFile ||
            (!noIndispo &&
                (!jsonFile.Dispos || jsonFile.Dispos.length === 0)) ||
            !jsonFile.Cours ||
            jsonFile.Cours.length === 0
        ) {
            const missingInfoDialog = document.getElementById('missing-info');
            let missingInfoId = document.getElementById('missing-info-id');
            if (!jsonFile) {
                missingInfoId.textContent += 'Enseignements';
                if (!noIndispo) {
                    missingInfoId.textContent += ' & Indisponibilités';
                }
            } else {
                if (!jsonFile.Cours || jsonFile.Cours.length === 0) {
                    missingInfoId.textContent += 'Enseignements';
                }
                if (
                    !noIndispo &&
                    (!jsonFile.Dispos || jsonFile.Dispos.length === 0)
                ) {
                    if (missingInfoId.textContent) {
                        missingInfoId.textContent += ' & ';
                    }
                    missingInfoId.textContent += 'Indisponibilités';
                }
            }
            const missingOkBtn = missingInfoDialog.querySelector('button');
            missingOkBtn.addEventListener('click', () => {
                missingInfoId.textContent = null;
                missingInfoDialog.close();
            });
            missingInfoDialog.showModal();
            return;
        }
        jsonFile.Cours.sort((a, b) => {
            const intA = a.intitulé.toLowerCase();
            const intB = b.intitulé.toLowerCase();
            return intA.localeCompare(intB);
        });
        jsonFile.Cours.sort((a, b) => {
            const semA = a.semestre.toLowerCase();
            const semB = b.semestre.toLowerCase();
            return semA.localeCompare(semB);
        });
        jsonFile.Cours.sort((a, b) => {
            const filA = a.filière.toLowerCase();
            const filB = b.filière.toLowerCase();
            return filA.localeCompare(filB);
        });
        const summaryDiv = document.getElementById('summary');
        summaryDiv.innerHTML = null;
        let volTotal = 0;
        let eqtdTotal = 0;
        let filières = jsonFile.Cours.map((c) => c.filière);
        filières = [...new Set(filières)];
        const filièreList = document.createElement('ul');
        for (let f of filières) {
            const filièreItem = document.createElement('li');
            filièreItem.textContent = f;
            const fCourses = jsonFile.Cours.filter((c) => c.filière === f);
            let semestres = fCourses.map((c) => c.semestre);
            semestres = [...new Set(semestres)];
            const semestreList = document.createElement('ul');
            for (s of semestres) {
                const semestreItem = document.createElement('li');
                semestreItem.textContent = s;
                const sCourses = fCourses.filter((c) => c.semestre === s);
                const scList = document.createElement('ul');
                for (sc of sCourses) {
                    const scItem = document.createElement('li');
                    scItem.textContent = `${sc.intitulé} : ${sc.volume}h = ${sc.eqtd}h TD`;
                    scList.appendChild(scItem);
                }
                semestreItem.appendChild(scList);
                semestreList.appendChild(semestreItem);
            }
            filièreItem.appendChild(semestreList);
            filièreList.appendChild(filièreItem);
        }
        summaryDiv.appendChild(filièreList);
        for (c of jsonFile.Cours) {
            volTotal += Number(c.volume);
            eqtdTotal += Number(c.eqtd);
        }
        const indisposDiv = document.getElementById('indispos');
        indisposDiv.innerHTML = null;
        if (!jsonFile.Dispos || jsonFile.Dispos.length === 0) {
            indisposDiv.textContent = 'Aucune';
        } else {
            let days = jsonFile.Dispos.map((i) => i.day);
            days = [...new Set(days)];
            const dayList = document.createElement('ul');
            for (let d of days) {
                const dayItem = document.createElement('li');
                dayItem.textContent = d;
                const dIndispos = jsonFile.Dispos.filter((i) => i.day === d);
                const hourList = document.createElement('ul');
                for (let dI of dIndispos) {
                    const hourItem = document.createElement('li');
                    hourItem.textContent = dI.hour;
                    const prevHourItem = hourList.lastElementChild;
                    if (prevHourItem) {
                        const endHour = prevHourItem.textContent
                            .split('-')[1]
                            .trim();
                        const begHour = hourItem.textContent
                            .split('-')[0]
                            .trim();
                        if (endHour === begHour) {
                            const begHour = prevHourItem.textContent
                                .split('-')[0]
                                .trim();
                            const endHour = hourItem.textContent
                                .split('-')[1]
                                .trim();
                            prevHourItem.textContent = `${begHour} - ${endHour}`;
                        } else hourList.appendChild(hourItem);
                    } else {
                        hourList.appendChild(hourItem);
                    }
                }
                dayList.appendChild(dayItem);
                dayList.appendChild(hourList);
            }
            indisposDiv.appendChild(dayList);
        }
        const remarksSummary = document.getElementById('remarks-summary');
        if (remarksTextArea.value) {
            remarks = remarksTextArea.value;
            jsonFile.Remarques = remarks;
            remarksSummary.textContent = `Remarques : ${remarks}`;
        }
        eqtdTotal = Number(parseFloat(Number(eqtdTotal).toFixed(2)));
        const profSummary = document.getElementById('prof-summary');
        profSummary.textContent = `Total : ${eqtdTotal}h éq. TD`;
        if (eqtdTotal > tService) {
            profSummary.textContent += ` (${eqtdTotal - tService}HC)`;
        }
        if (tService !== Infinity) {
            if (
                (tHc && eqtdTotal > tService + tHc) ||
                eqtdTotal > tService * 2 ||
                eqtdTotal < tService
            ) {
                profSummary.style.color = 'red';
                profSummary.textContent += ` ⚠️`;
                if (eqtdTotal < tService) {
                    profSummary.textContent += ` — volume horaire insuffisant`;
                    let newDiv = document.createElement('div');
                    newDiv.textContent = `Vous pouvez télécharger le fichier pour reprendre la saisie ultérieurement.`;
                    profSummary.after(newDiv);
                    yesBtn.disabled = true;
                } else if (
                    (tHc && eqtdTotal > tService + tHc) ||
                    eqtdTotal > tService * 2
                ) {
                    profSummary.textContent += ` — volume horaire supérieur à la limite autorisée`;
                    let newDiv = document.createElement('div');
                    newDiv.textContent = `Vous pouvez télécharger le fichier pour reprendre la saisie ultérieurement.`;
                    profSummary.after(newDiv);
                    yesBtn.disabled = true;
                }
            } else {
                profSummary.style.color = 'green';
                yesBtn.disabled = false;
            }
        }
        confirmDialog.showModal();
    };

    let saved = false;

    let uploadAttempts = 0;
    dlBtn.onclick = async () => {
        await downloadFile();
        confirmDialog.innerHTML = null;
        const doneDiv = document.createElement('div');
        doneDiv.innerHTML =
            '<p>Votre fichier de vœux est téléchargé.</p><p>Cliquez ci-dessous pour vous déconnecter.</p>';
        doneDiv.style.textAlign = 'center';
        const okBtn = document.createElement('button');
        okBtn.classList.add('wishes-ui');
        okBtn.textContent = 'OK';
        okBtn.onclick = () => {
            saveToken();
            confirmDialog.close();
        };
        confirmDialog.style.display = 'flex';
        confirmDialog.style.flexDirection = 'column';
        confirmDialog.appendChild(doneDiv);
        confirmDialog.appendChild(okBtn);
    };
    yesBtn.onclick = async () => {
        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        yesBtn.innerHTML = null;
        yesBtn.appendChild(spinner);
        let data = await uploadFile();
        let message =
            '<p>Votre fichier de vœux a été envoyé.</p><p>Voulez-vous télécharger un fichier de sauvegarde ?</p><p>(Déconseillé sur un ordinateur partagé)</p>';
        if (!data) {
            const download = window.confirm(
                "Le fichier n'a pas pu être envoyé.\nSouhaitez-vous le télécharger ?"
            );
            if (download) {
                message =
                    '<p>Votre fichier de vœux est téléchargé et prêt à être envoyé.</p><p>Cliquez ci-dessous pour vous déconnecter.</p>';
                await downloadFile();
            } else {
                spinner.remove();
                yesBtn.textContent = 'Réessayer';
                return;
            }
        }
        saved = true;
        spinner.remove();
        yesBtn.textContent = 'Confirmer';
        checkData();
        confirmDialog.innerHTML = null;
        const doneDiv = document.createElement('div');
        doneDiv.innerHTML = message;
        doneDiv.style.textAlign = 'center';
        const btnDiv = document.createElement('div');
        const okBtn = document.createElement('button');
        okBtn.classList.add('wishes-ui');
        okBtn.style.width = '92px';
        okBtn.textContent = 'Oui';
        okBtn.onclick = async () => {
            await downloadFile();
            saveToken();
            confirmDialog.close();
        };
        const cancelBtn = document.createElement('button');
        cancelBtn.classList.add('wishes-ui');
        cancelBtn.classList.add('reset-btn');
        cancelBtn.style.width = '92px';
        cancelBtn.textContent = 'Non';
        cancelBtn.onclick = () => {
            saveToken();
            confirmDialog.close();
        };
        btnDiv.style.display = 'flex';
        btnDiv.style.flexDirection = 'row';
        btnDiv.style.justifyContent = 'space-around';
        confirmDialog.style.display = 'flex';
        confirmDialog.style.flexDirection = 'column';
        btnDiv.appendChild(okBtn);
        btnDiv.appendChild(cancelBtn);
        confirmDialog.appendChild(doneDiv);
        confirmDialog.appendChild(btnDiv);
    };

    async function uploadFile() {
        uploadAttempts++;
        const date = new Date().toISOString().split('-')[0];
        const name = tName.replaceAll(' ', '_');
        const myBlob = new Blob([JSON.stringify(jsonFile)], {
            type: 'text/plain',
        });
        let formData = new FormData();
        formData.append('file', myBlob, `${name}_${date}.json`);
        formData.append('action', 'upload');
        formData.append('token', dropboxToken);
        // const res = await fetch('dropbox.php', {
        //     method: 'POST',
        //     body: formData,
        // });
        const res = await fetch(
            'https://prendrelangue.fr/wp-content/uploads/voeux/dropbox.php',
            {
                method: 'POST',
                body: formData,
            }
        );
        if (res.ok) {
            const data = await res.json();
            if (!data.success) {
                if (data.status === 401) {
                    if (uploadAttempts < 4) {
                        dropboxToken = await getDropboxToken();
                        uploadFile();
                        return;
                    } else {
                        console.error('Could not authenticate', data.message);
                        return false;
                    }
                } else {
                    console.error('Error uploading file', data.message);
                    return false;
                }
            } else {
                uploadAttempts = 0;
                return true;
            }
        } else {
            return false;
        }
    }

    function downloadFile() {
        return new Promise((resolve) => {
            const date = new Date().toISOString().split('-')[0];
            const name = tName.replaceAll(' ', '_');
            const myBlob = new Blob([JSON.stringify(jsonFile)], {
                type: 'text/plain',
            });
            const url = window.URL.createObjectURL(myBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Vœux_${name}_${date}.json`;
            a.click();
            window.URL.revokeObjectURL(url);
            resolve();
        });
    }
    noBtn.onclick = () => {
        confirmDialog.close();
    };

    // Handle availability table
    dispoCheck.addEventListener('change', () => {
        if (dispoCheck.checked) {
            for (let tc of tableCells) {
                deselect(tc);
            }
            if (jsonFile && jsonFile.Dispos) {
                jsonFile.Dispos = [];
            }
            noIndispo = true;
        } else {
            noIndispo = false;
        }
    });

    // Adapt availability table depending on screen size
    const mediaQuery = window.matchMedia('(max-aspect-ratio: 1/1)');
    function adaptToScreen(e) {
        if (e.matches) {
            const tableHeaders = Array.from(document.querySelectorAll('th'));
            for (let i = 1; i < 6; i++) {
                tableHeaders[i].textContent =
                    tableHeaders[i].textContent.slice(0, 2) + '.';
            }
            for (let i = 5; i < 17; i++) {
                tableHeaders[i].textContent = tableHeaders[i].textContent
                    .replaceAll('h', '')
                    .replaceAll(' ', '');
            }
        }
    }
    mediaQuery.addEventListener('change', adaptToScreen);
    adaptToScreen(mediaQuery);

    function showRed() {
        this.style.backgroundColor = '#ffe6e6';
        this.textContent = '❌';
    }
    function showGreen() {
        this.textContent = '✅';
        this.style.backgroundColor = 'rgb(214, 245, 214)';
    }
    let isSelecting = false;
    for (let tc of tableCells) {
        const index = tc.cellIndex;
        const header = table.rows[0].cells[index];
        const day = header.textContent;
        const hour = tc.parentNode.firstElementChild.textContent;
        tc.addEventListener('mousedown', (e) => {
            e.preventDefault();
            if (e.button === 0) {
                isGliding = true;
                if (!tc.classList.contains('selected')) {
                    isSelecting = true;
                    select(tc, day, hour);
                } else {
                    isSelecting = false;
                    deselect(tc, day, hour);
                }
            }
        });
        tc.addEventListener('mouseover', (e) => {
            e.preventDefault();
            if (e.button === 0 && isGliding) {
                if (!tc.classList.contains('selected')) {
                    select(tc, day, hour);
                } else if (tc.classList.contains('selected')) {
                    deselect(tc, day, hour);
                }
            }
        });
        window.addEventListener('mouseup', (e) => {
            e.preventDefault();
            isGliding = false;
        });
    }
    function select(tc, day, hour) {
        tc.classList.add('selected');
        if (tc.classList.contains('selected')) {
            tc.style.backgroundColor = '#ffe6e6';
            tc.textContent = '❌';
            const dispo = {};
            dispo.day = day;
            dispo.hour = hour;
            tc.addEventListener('mouseover', showGreen);
            tc.addEventListener('mouseout', showRed);
            saveDispo(dispo);
        }
    }
    function deselect(tc, day, hour) {
        tc.classList.remove('selected');
        tc.removeEventListener('mouseover', showGreen);
        tc.removeEventListener('mouseout', showRed);
        tc.textContent = '';
        tc.removeAttribute('style');
        if (day && hour) {
            const dispo = jsonFile.Dispos.find(
                (d) => d.day === day && d.hour === hour
            );
            deleteDispo(dispo);
        }
    }
    const days = {
        Lundi: 1,
        Mardi: 2,
        Mercredi: 3,
        Jeudi: 4,
        Vendredi: 5,
    };
    function saveDispo(dispo) {
        if (!jsonFile) {
            jsonFile = {};
            jsonFile.Name = tName;
            jsonFile.Dispos = [];
            jsonFile.Dispos.push(dispo);
        } else if (jsonFile && !jsonFile.Dispos) {
            jsonFile.Dispos = [];
            jsonFile.Dispos.push(dispo);
        } else if (jsonFile && jsonFile.Dispos) {
            jsonFile.Dispos.push(dispo);
        }
        jsonFile.Dispos.sort((a, b) => {
            const dayA = days[a.day];
            const dayB = days[b.day];
            if (dayA === dayB) {
                return a.hour.localeCompare(b.hour);
            }
            return dayA - dayB;
        });
        dispoCheck.checked = false;
        noIndispo = false;
        checkData();
    }
    function deleteDispo(dispo) {
        const d = jsonFile.Dispos.indexOf(dispo);
        jsonFile.Dispos.splice(d, 1);
        if (jsonFile.Dispos.length === 0) {
            dispoCheck.checked = true;
            noIndispo = true;
        }
        checkData();
    }

    function checkData() {
        if (
            !saved &&
            jsonFile &&
            ((jsonFile.Cours && jsonFile.Cours.length > 0) ||
                (jsonFile.Dispos && jsonFile.Dispos.length > 0))
        ) {
            window.addEventListener('beforeunload', warnClose);
        } else {
            window.removeEventListener('beforeunload', warnClose);
        }
    }
    function warnClose(e) {
        e.preventDefault();
    }
});
