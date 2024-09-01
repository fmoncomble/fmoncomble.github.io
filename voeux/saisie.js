document.addEventListener('DOMContentLoaded', async () => {
    const tokenInput = document.getElementById('token-input');
    const authSaveBtn = document.getElementById('auth-save');
    const teacherInputDiv = document.getElementById('teacher-input-div');
    const teacherInput = document.getElementById('teacher-name');
    const goBtn = document.getElementById('go-btn');
    const teacherStatus = document.getElementById('teacher-status');
    const teacherService = document.getElementById('teacher-service');
    const courseChoiceDiv = document.getElementById('class-choice');
    const filièreInput = document.getElementById('filière');
    const semestreInput = document.getElementById('semestre');
    const courseInput = document.getElementById('cours');
    const courseInfo = document.getElementById('course-info');
    const saveDiv = document.getElementById('save');
    const saveBtn = document.getElementById('save-btn');
    const sendBtn = document.getElementById('send-btn');
    const hTotal = document.getElementById('hTotal');
    const hc = document.getElementById('hc');

    const instrDiv = document.getElementById('instructions');
    const firstTimeDialog = document.getElementById('first-time');
    const okBtn = firstTimeDialog.querySelector('button#ok-btn');
    okBtn.addEventListener('click', () => {
        firstTimeDialog.close();
    });
    const instrDialog = document.getElementById('instructions-dialog');
    instrDiv.addEventListener('click', () => {
        instrDialog.showModal();
    });

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
        token = localStorage.getItem('saisie-github-token');
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
            }
            if (!understand) {
                firstTimeDialog.showModal();
            }
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
    async function saveToken() {
        if (tokenInput.value && !token) {
            localStorage.setItem(
                'saisie-github-token',
                tokenInput.value.trim()
            );
            checkToken();
        } else if (token) {
            localStorage.removeItem('saisie-github-token');
            token = null;
            tokenInput.removeAttribute('style');
            tokenInput.type = 'password';
            tokenInput.disabled = false;
            tokenInput.value = null;
            authSaveBtn.textContent = 'Enregistrer';
            authSaveBtn.classList.remove('reset-btn');
            tokenInput.placeholder = "Jeton d'authentification";
            teacherInput.value = null;
            teacherStatus.textContent = null;
            teacherService.textContent = null;
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
        }
    }

    // Get profs and cours files
    async function getFile(url) {
        try {
            const token = localStorage.getItem('saisie-github-token');
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

    goBtn.onclick = start;
    teacherInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            start();
        }
    });

    function start() {
        if (!understand) {
            instrDialog.showModal();
        }
        if (!teacherInput.value) {
            window.alert('Entrez votre nom');
            teacherInput.focus();
            return;
        }
        const dispoContainer = document.getElementById('container-2');
        dispoContainer.style.display = 'block';
        jsonFile = null;
        const addedCourses = document.getElementById('added-courses');
        addedCourses.style.display = 'none';
        saveBtn.style.display = 'none';
        const addedCoursesList = document.getElementById('added-courses-list');
        const items = addedCoursesList.querySelectorAll('div');
        for (let i of items) {
            i.remove();
        }
        const teachers = new Set();
        for (t of teacherData) {
            teachers.add(t.name);
        }
        tName = teacherInput.value;
        if (!teachers.has(teacherInput.value)) {
            window.alert(
                'Le nom saisi ne fait pas partie de la liste.\nContactez Florent Moncomble et Guillaume Winter pour vous ajouter'
            );
            return;
        }
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
        filièreInput.value = 'LLCER';
        filière = 'LLCER';
        semestreInput.value = 'S1';
        semestre = 'S1';
        buildCourseList();
        courseChoiceDiv.style.display = 'block';
    }

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

    function saveCourse(course) {
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
        const addedCourses = document.getElementById('added-courses');
        addedCourses.style.display = 'block';
        const addedCoursesList = document.getElementById('added-courses-list');
        addedCoursesList.style.display = 'block';
        const entry = document.createElement('div');
        entry.id = `entry${i}`;
        entry.classList.add('course-entry');
        const addedCourse = document.createElement('span');
        addedCourse.style.verticalAlign = 'sub';
        entry.setAttribute('course-id', course.id);
        const deleteBtn = document.createElement('span');
        addedCourse.textContent = `${course.filière} — ${course.semestre} — ${course.intitulé} : ${course.volume}h ${course.format}`;
        if (course.format !== 'TD') {
            addedCourse.textContent += ` = ${course.eqtd}h éq. TD`;
        }
        deleteBtn.textContent = ' ❌';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.classList.add('btn');
        deleteBtn.onclick = () => deleteEntry(course, entry);
        const duplicateBtn = document.createElement('span');
        duplicateBtn.textContent = ' ➕';
        duplicateBtn.style.cursor = 'pointer';
        duplicateBtn.classList.add('btn');
        duplicateBtn.addEventListener('click', () =>
            duplicateEntry(course, entry, addedCourses)
        );
        entry.appendChild(addedCourse);
        entry.appendChild(deleteBtn);
        entry.appendChild(duplicateBtn);
        updateVol();
        const firstChild = addedCoursesList.firstChild;
        addedCoursesList.insertBefore(entry, firstChild);
        resetForm();
        i++;
    }

    function updateVol() {
        volTotal = 0;
        for (let c of jsonFile.Cours) {
            const cVol = Number(c.eqtd);
            volTotal += cVol;
            volTotal = Number(
                parseFloat(Number(volTotal).toFixed(2)).toString()
            );
        }
        hTotal.textContent = volTotal + ' hTD';
        if (volTotal >= tService) {
            hTotal.style.color = 'green';
            if (volTotal > tService) {
                volHc = Number(
                    parseFloat(
                        (volTotal - Number(tService)).toFixed(2)
                    ).toString()
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
            hTotal.style.color = 'orange';
        }
        if (tService === Infinity) {
            hTotal.style.color = 'black';
        }
    }

    function deleteEntry(course, entry) {
        const c = jsonFile.Cours.indexOf(course);
        const deletedCourse = jsonFile.Cours.splice(c, 1);
        updateVol();
        entry.remove();
        const courseId = course.id;
        const entries = Array.from(
            document
                .getElementById('added-courses-list')
                .querySelectorAll(`div[course-id="${courseId}"]`)
        );
        if (entries.length > 0) {
            const firstEntry = entries[0];
            const btns = Array.from(firstEntry.querySelectorAll('span.btn'));
            if (btns.length < 2) {
                const duplicateBtn = document.createElement('span');
                duplicateBtn.textContent = ' ➕';
                duplicateBtn.style.cursor = 'pointer';
                duplicateBtn.classList.add('btn');
                duplicateBtn.addEventListener('click', () =>
                    duplicateEntry(course, firstEntry)
                );
                firstEntry.appendChild(duplicateBtn);
            }
        }
    }

    function duplicateEntry(course, entry, addedCourses) {
        const existingCourses = jsonFile.Cours.filter(
            (c) => c.id === course.id
        );
        if (existingCourses && existingCourses.length >= course.nbgrp) {
            window.alert('Le nombre de groupes est atteint pour ce cours');
            return;
        }
        jsonFile.Cours.push(course);
        const newEntry = entry.cloneNode(true);
        const btns = Array.from(newEntry.querySelectorAll('span.btn'));
        for (let b of btns) {
            b.remove();
        }
        newEntry.id = `entry${i}`;
        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = ' ❌';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.classList.add('btn');
        deleteBtn.onclick = () => deleteEntry(course, newEntry);
        newEntry.appendChild(deleteBtn);
        entry.after(newEntry);
        updateVol();
        i++;
    }

    function resetForm() {
        courseInfo.textContent = null;
        courseInfo.style.display = 'none';
        courseInput.value = courseInput.querySelector('option[disabled]').value;
        saveBtn.removeAttribute('style');
        saveBtn.style.display = 'none';
    }

    const confirmDialog = document.getElementById('confirm-dialog');
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
                    hourList.appendChild(hourItem);
                }
                dayList.appendChild(dayItem);
                dayList.appendChild(hourList);
            }
            indisposDiv.appendChild(dayList);
        }
        eqtdTotal = Number(parseFloat(Number(eqtdTotal).toFixed(2)).toString());
        const profSummary = document.getElementById('prof-summary');
        profSummary.textContent = `Total : ${eqtdTotal}h éq. TD`;
        if (eqtdTotal > tService) {
            profSummary.textContent += ` (${eqtdTotal - tService}HC)`;
        }
        if (
            (tHc && eqtdTotal > tService + tHc) ||
            eqtdTotal > tService * 2 ||
            eqtdTotal < tService
        ) {
            profSummary.style.color = 'red';
            profSummary.textContent += ` ⚠️`;
            if (eqtdTotal < tService) {
                profSummary.textContent += ` — volume horaire insuffisant`;
            } else if (
                (tHc && eqtdTotal > tService + tHc) ||
                eqtdTotal > tService * 2
            ) {
                profSummary.textContent += ` — volume horaire supérieur à la limite autorisée`;
            }
        } else {
            profSummary.style.color = 'green';
        }
        confirmDialog.showModal();
    };

    const yesBtn = document.getElementById('yes-btn');
    const noBtn = document.getElementById('no-btn');

    yesBtn.onclick = () => {
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
        confirmDialog.close();
    };
    noBtn.onclick = () => {
        confirmDialog.close();
    };

    // Handle availability table
    const table = document.querySelector('table');
    const tableCells = Array.from(document.querySelectorAll('td'));
    const dispoCheck = document.querySelector('input#dispo-check');
    let noIndispo = true;
    dispoCheck.addEventListener('change', () => {
        if (dispoCheck.checked) {
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

    for (let tc of tableCells) {
        function showRed() {
            tc.style.backgroundColor = '#ffe6e6';
            tc.textContent = '❌';
        }
        function showGreen() {
            tc.textContent = '✅';
            tc.style.backgroundColor = 'rgb(214, 245, 214)';
        }
        tc.addEventListener('click', () => {
            const index = tc.cellIndex;
            const header = table.rows[0].cells[index];
            const day = header.textContent;
            const hour = tc.parentNode.firstElementChild.textContent;
            if (!tc.classList.contains('selected')) {
                tc.classList.toggle('selected');
                tc.style.backgroundColor = '#ffe6e6';
                tc.textContent = '❌';
                const dispo = {};
                dispo.day = day;
                dispo.hour = hour;
                tc.addEventListener('mouseover', showGreen);
                tc.addEventListener('mouseout', showRed);
                saveDispo(dispo);
            } else {
                tc.classList.toggle('selected');
                tc.removeEventListener('mouseover', showGreen);
                tc.removeEventListener('mouseout', showRed);
                tc.textContent = '';
                tc.removeAttribute('style');
                const dispo = jsonFile.Dispos.find(
                    (d) => d.day === day && d.hour === hour
                );
                deleteDispo(dispo);
            }
        });
    }
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
        dispoCheck.checked = false;
        noIndispo = false;
    }
    function deleteDispo(dispo) {
        const d = jsonFile.Dispos.indexOf(dispo);
        jsonFile.Dispos.splice(d, 1);
        if (jsonFile.Dispos.length === 0) {
            dispoCheck.checked = true;
            noIndispo = true;
        }
    }
});
