document.addEventListener('DOMContentLoaded', async () => {
    const authDiv = document.getElementById('auth-div');
    const profAddInput = document.getElementById('prof-name');
    const profStatusSelect = document.getElementById('status-select');
    const profAddBtn = document.getElementById('prof-add-btn');
    const profDeleteInput = document.getElementById('prof-name-2');
    const profModifyBtn = document.getElementById('prof-modify-btn');
    const profDeleteBtn = document.getElementById('prof-delete-btn');
    const filièreSelect = document.getElementById('course-filière');
    const semestreSelect = document.getElementById('course-semestre');
    const formatSelect = document.getElementById('format-select');
    const grpInput = document.getElementById('grp-input');
    const volumeInput = document.getElementById('volume-input');
    const eqtdInput = document.getElementById('eqtd-input');
    const courseInput = document.getElementById('course-name');
    const courseAddBtn = document.getElementById('course-add-btn');
    const filièreSelect2 = document.getElementById('course-filière-2');
    const semestreSelect2 = document.getElementById('course-semestre-2');
    const courseSelect2 = document.getElementById('course-name-2');
    const courseModifyBtn = document.getElementById('course-modify-btn');
    const courseCopyBtn = document.getElementById('course-copy-btn');
    const courseDeleteBtn = document.getElementById('course-delete-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const profList = document.getElementById('prof-list');
    const showProfs = document.getElementById('show-profs');
    const profsDisplay = document.getElementById('profs-display');

    profAddInput.addEventListener('input', () => {
        if (profAddInput.value) {
            profCancelBtn.disabled = false;
        } else {
            profCancelBtn.disabled = true;
        }
    });

    courseInput.addEventListener('input', () => {
        if (courseInput.value) {
            courseCancelBtn.disabled = false;
        } else {
            courseCancelBtn.disabled = true;
        }
    });
    // Manage authentication & get data
    let token;
    let teacherData;
    let courseData;
    const teacherDBUrl =
        'https://api.github.com/repos/fmoncomble/voeux/contents/profs.json?ref=main';
    const courseDBUrl =
        'https://api.github.com/repos/fmoncomble/voeux/contents/cours.json?ref=main';

    async function checkToken() {
        function showAuthDialog() {
            const authDialog = document.getElementById('auth-dialog');
            authDialog.showModal();
            const authInput = document.getElementById('auth-input');
            authInput.focus();
            const authSaveBtn = document.getElementById('auth-save-btn');
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
        }
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
                showAuthDialog();
                return;
            } else {
                authDiv.style.display = 'block';
                if (!teacherData && !courseData) {
                    teacherData = await getFile(teacherDBUrl);
                    courseData = await getFile(courseDBUrl);
                    if (teacherData && courseData) {
                        buildProfList();
                        buildCourseList();
                        getCourseIds();
                    }
                }
            }
        } else {
            authDiv.style.display = 'none';
            showAuthDialog();
        }
    }
    checkToken();

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('github-token');
        token = null;
        checkToken();
    });

    // Get profs and cours files
    async function getFile(url) {
        try {
            const ghToken = localStorage.getItem('github-token');
            const headers = new Headers({
                Authorization: `Bearer ${ghToken}`,
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
            } else {
                const authDialog = document.getElementById('auth-dialog');
                authDialog.showModal();
                const authInput = document.getElementById('auth-input');
                const authSaveBtn = document.getElementById('auth-save-btn');
                authSaveBtn.onclick = () => {
                    if (!authInput.value) {
                        spinner.style.display = 'none';
                        return;
                    } else {
                        token = authInput.value.trim();
                        localStorage.setItem('github-token', token);
                        checkToken();
                    }
                    authDialog.close();
                };
            }
        } catch (error) {
            console.error(error);
        }
    }

    // Build prof list
    function buildProfList() {
        const options = Array.from(profList.querySelectorAll('option'));
        for (o of options) {
            o.remove();
        }
        for (t of teacherData) {
            const option = document.createElement('option');
            option.value = t.name;
            profList.appendChild(option);
        }
    }

    // Limit available semester options according to filière
    let filière = 'LLCER';
    filièreSelect.value = filière;
    let semestre = 'S1';
    semestreSelect.value = semestre;
    filièreSelect.addEventListener('change', () => {
        adjustGrpNb();
        filière = filièreSelect.value;
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

    let filière2 = 'LLCER';
    filièreSelect2.value = filière2;
    let semestre2 = 'S1';
    semestreSelect2.value = semestre2;
    filièreSelect2.addEventListener('change', () => {
        filière2 = filièreSelect2.value;
        const options = Array.from(filièreSelect2.querySelectorAll('option'));
        const optionLevel = options.find(
            (o) => o.value === filièreSelect2.value
        ).dataset.level;
        if (optionLevel === 'm') {
            const sOptions =
                semestreSelect2.querySelectorAll('option[data-notm]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        } else if (optionLevel === 'a') {
            const sOptions =
                semestreSelect2.querySelectorAll('option[data-nota]');
            sOptions.forEach((s) => {
                s.disabled = true;
            });
        } else {
            semestreSelect2.querySelectorAll('option').forEach((o) => {
                o.disabled = false;
            });
        }
        buildCourseList();
    });
    semestreSelect2.addEventListener('change', () => {
        semestre2 = semestreSelect2.value;
        buildCourseList();
    });

    // Collect course IDs
    let courseIds = new Set();
    function getCourseIds() {
        for (let c of courseData) {
            if (c.id) {
                courseIds.add(c.id);
            }
        }
    }

    // Build available course list according to filière and semestre
    function buildCourseList() {
        const options = Array.from(courseSelect2.querySelectorAll('option'));
        for (o of options) {
            o.remove();
        }
        courseData.sort(sortByInt);
        courseData.sort(sortBySem);
        courseData.sort(sortByFil);
        const courses = courseData.filter(
            (c) => c.filière === filière2 && c.semestre === semestre2
        );
        for (c of courses) {
            const option = document.createElement('option');
            option.value = c.intitulé;
            option.textContent = c.intitulé;
            courseSelect2.appendChild(option);
        }
    }

    // Add prof
    let profChanged = false;
    let profModify = false;
    profAddBtn.addEventListener('click', () => {
        addProf();
    });
    function addProf() {
        if (!profAddInput.value) {
            window.alert('Entrez un nom');
            profAddInput.focus();
            return;
        }
        const customService = Number(
            document.getElementById('custom-service').value
        );
        const customHc = Number(document.getElementById('custom-hc').value);
        let newProf = {
            name: profAddInput.value,
            status: profStatusSelect.value,
        };
        if (customService) {
            newProf.service = customService;
        }
        if (customHc) {
            newProf.hc = customHc;
        }
        const checkProf = teacherData.find(
            (t) => t.name === profAddInput.value
        );
        if (checkProf) {
            if (
                checkProf.status !== profStatusSelect.value ||
                checkProf.service !== customService ||
                checkProf.hc !== customHc
            ) {
                const dialog = document.createElement('dialog');
                const div = document.createElement('div');
                div.textContent =
                    'Il y a déjà un·e enseignant·e à ce nom : mettre à jour les données ?';
                dialog.appendChild(div);
                const yesBtn = document.createElement('button');
                yesBtn.classList.add('wishes-ui');
                yesBtn.textContent = 'Oui';
                dialog.appendChild(yesBtn);
                const noBtn = document.createElement('button');
                noBtn.classList.add('wishes-ui', 'reset-btn');
                noBtn.textContent = 'Non';
                noBtn.style.display = 'inline-block';
                dialog.appendChild(noBtn);
                yesBtn.onclick = () => {
                    const index = teacherData.indexOf(checkProf);
                    teacherData.splice(index, 1, newProf);
                    dialog.remove();
                    const addedProfDiv =
                        document.getElementById('added-prof-div');
                    addedProfDiv.textContent = `${newProf.name} a été modifié·e.`;
                    addedProfDiv.style.display = 'block';
                    setTimeout(() => {
                        addedProfDiv.style.display = 'none';
                        addedProfDiv.textContent = null;
                    }, 1000);
                    profChanged = true;
                    compareData();
                    buildProfList();
                    if (profsDisplay.style.maxHeight) {
                        let update = true;
                        displayProfs(update);
                    }
                };
                noBtn.onclick = () => {
                    dialog.remove();
                    return;
                };
                document.body.appendChild(dialog);
                dialog.showModal();
            } else {
                window.alert('Il y a déjà un·e enseignant·e à ce nom');
                return;
            }
        } else {
            teacherData.push(newProf);
            teacherData.sort((a, b) => {
                const aSegments = a.name.split(' ');
                const bSegments = b.name.split(' ');
                let result = 0;
                let i = 1;
                while (result === 0 && i >= 0) {
                    const intA = aSegments[i].toLowerCase();
                    const intB = bSegments[i].toLowerCase();
                    i--;
                    result = intA.localeCompare(intB);
                }
                return result;
            });
            const addedProfDiv = document.getElementById('added-prof-div');
            addedProfDiv.textContent = `${profAddInput.value} a été ajouté·e`;
            addedProfDiv.style.display = 'block';
            setTimeout(() => {
                addedProfDiv.style.display = 'none';
                addedProfDiv.textContent = null;
            }, 1000);
            profAddInput.value = null;
            profChanged = true;
            compareData();
            buildProfList();
            if (profsDisplay.style.maxHeight) {
                let update = true;
                displayProfs(update);
            }
        }
        document.getElementById('prof-add').firstElementChild.textContent =
            'Ajouter un·e enseignant·e :';
        profModify = false;
        if (profAddBtn.textContent === 'Modifier') {
            profAddBtn.textContent = 'Ajouter';
        }
    }

    const profCancelBtn = document.getElementById('prof-add-cancel');
    profCancelBtn.addEventListener('click', () => {
        const elts = document
            .getElementById('prof-add')
            .querySelectorAll('select, input');
        for (let elt of elts) {
            if (elt.tagName === 'SELECT') {
                elt.value = elt.querySelectorAll('option')[0].value;
            } else if (elt.tagName === 'INPUT') {
                elt.value = null;
            }
            elt.removeAttribute('style');
        }
        profCancelBtn.disabled = true;
        profAddBtn.textContent = 'Ajouter';
        document.getElementById('prof-add').firstElementChild.textContent =
            'Ajouter un·e enseignant·e :';
        profModify = false;
    });

    // Modify prof
    profModifyBtn.addEventListener('click', () => {
        modifyProf();
    });
    function modifyProf() {
        document.getElementById('prof-add').firstElementChild.textContent =
            "Modifier l'enseignant·e :";
        const oldProfName = profDeleteInput.value;
        if (!oldProfName) {
            window.alert("Entrez le nom de l'enseignant·e à modifier");
            profDeleteInput.focus();
            return;
        }
        const oldProf = teacherData.find((t) => t.name === oldProfName);
        profAddInput.value = oldProf.name;
        profStatusSelect.value = oldProf.status;
        if (oldProf.service) {
            document.getElementById('custom-service').value = oldProf.service;
        }
        profAddBtn.textContent = 'Modifier';
        const elts = document
            .getElementById('prof-add')
            .querySelectorAll('select, input');
        for (let elt of elts) {
            elt.style.backgroundColor = '#e9fce9';
        }
        profModify = true;
        profAddInput.focus();
        profCancelBtn.disabled = false;
    }

    // Delete prof
    profDeleteBtn.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment supprimer`;
        const div2 = document.createElement('div');
        div2.style.fontWeight = 'bold';
        div2.textContent = `${profDeleteInput.value} ?`;
        const yesBtn = document.createElement('button');
        yesBtn.classList.add('wishes-ui', 'reset-btn');
        yesBtn.textContent = 'Oui';
        yesBtn.addEventListener('click', () => {
            dialog.remove();
            deleteProf();
        });
        const noBtn = document.createElement('button');
        noBtn.classList.add('wishes-ui');
        noBtn.textContent = 'Non';
        noBtn.addEventListener('click', () => {
            dialog.remove();
        });
        document.body.appendChild(dialog);
        dialog.appendChild(div);
        dialog.appendChild(div2);
        dialog.appendChild(yesBtn);
        dialog.appendChild(noBtn);
        dialog.showModal();
    });
    function deleteProf() {
        const oldProfName = profDeleteInput.value;
        if (!oldProfName) {
            window.alert("Entrez le nom de l'enseignant·e à supprimer");
            profDeleteInput.focus();
            return;
        }
        const oldProf = teacherData.find((t) => t.name === oldProfName);
        const index = teacherData.indexOf(oldProf);
        teacherData.splice(index, 1);
        const deletedProfDiv = document.getElementById('deleted-prof-div');
        const deletedProfSpan = document.getElementById('deleted-prof');
        deletedProfSpan.textContent = `${oldProfName}`;
        deletedProfDiv.style.display = 'block';
        setTimeout(() => {
            deletedProfDiv.style.display = 'none';
            deletedProfSpan.textContent = null;
        }, 1000);
        profDeleteInput.value = null;
        profChanged = true;
        compareData();
        buildProfList();
        if (profsDisplay.style.maxHeight) {
            let update = true;
            displayProfs(update);
        }
    }

    // Add course
    let courseChanged = false;
    courseAddBtn.addEventListener('click', () => {
        addCourse();
    });
    courseInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addCourse();
        }
    });
    courseInput.addEventListener('input', () => {
        adjustEqtd();
    });
    volumeInput.addEventListener('input', () => {
        adjustEqtd();
    });
    volumeInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            volumeSelect.value = 13;
            volumeInput.disabled = true;
        } else if (e.key === 'Enter') {
            addCourse();
        }
    });
    formatSelect.addEventListener('change', () => {
        adjustEqtd();
        adjustGrpNb();
    });

    const volumeSelect = document.getElementById('volume-select');
    volumeSelect.addEventListener('change', () => {
        if (volumeSelect.value === 'autre') {
            volumeInput.disabled = false;
            volumeInput.focus();
        } else {
            volumeInput.disabled = true;
            adjustEqtd();
        }
    });

    semestreSelect.addEventListener('change', () => {
        adjustGrpNb();
    });
    grpInput.value = 5;

    function adjustEqtd() {
        let multiplier;
        if (formatSelect.value === 'CM') {
            multiplier = 1.5;
        } else if (
            formatSelect.value === 'TD' ||
            formatSelect.value === 'TD_OPT'
        ) {
            multiplier = 1;
        } else if (formatSelect.value === 'TP') {
            multiplier = 1 / 1.5;
        }
        let result;
        if (volumeSelect.value !== 'autre') {
            result = (volumeSelect.value * multiplier).toFixed(2);
        } else if (volumeSelect.value === 'autre' && volumeInput.value) {
            result = (volumeInput.value * multiplier).toFixed(2);
        }
        eqtdInput.value = Number(parseFloat(result).toString());
    }

    function adjustGrpNb() {
        if (filièreSelect.value === 'LLCER' || filièreSelect.value === 'LEA') {
            if (formatSelect.value === 'CM') {
                grpInput.value = 1;
            } else if (formatSelect.value === 'TD') {
                if (semestreSelect.value === 'S1') {
                    grpInput.value = 5;
                } else if (semestreSelect.value === 'S2') {
                    grpInput.value = 4;
                } else if (
                    semestreSelect.value === 'S3' ||
                    semestreSelect.value === 'S4'
                ) {
                    grpInput.value = 3;
                } else if (
                    semestreSelect.value === 'S5' ||
                    semestreSelect.value === 'S6'
                ) {
                    grpInput.value = 2;
                }
            } else if (formatSelect.value === 'TP') {
                if (semestreSelect.value === 'S1') {
                    grpInput.value = 10;
                } else if (semestreSelect.value === 'S2') {
                    grpInput.value = 8;
                } else if (
                    semestreSelect.value === 'S3' ||
                    semestreSelect.value === 'S4'
                ) {
                    grpInput.value = 6;
                } else if (
                    semestreSelect.value === 'S5' ||
                    semestreSelect.value === 'S6'
                ) {
                    grpInput.value = 4;
                }
            }
        } else {
            grpInput.value = 1;
        }
    }

    let id;
    let courseModify = false;
    let courseCopy = false;
    function addCourse() {
        const format = formatSelect.value;
        let volume = Number(volumeSelect.value);
        if (volumeSelect.value === 'autre' && volumeInput.value) {
            volume = Number(volumeInput.value.replace(',', '.'));
        }
        if (!courseInput.value || (volumeSelect.value !== 'autre' && !volume)) {
            window.alert('Entrez un intitulé et/ou le volume horaire');
            if (!courseInput.value) {
                courseInput.focus();
            } else if (!volume) {
                volumeInput.focus();
            }
            return;
        }
        let nbgrp = Number(grpInput.value);
        let multiplier;
        if (format === 'CM') {
            multiplier = 1.5;
        } else if (format === 'TD' || format === 'TD_OPT') {
            multiplier = 1;
        } else if (format === 'TP') {
            multiplier = 1 / 1.5;
        }
        let eqtd;
        if (!eqtdInput.value) {
            let result = (volume * multiplier).toFixed(2);
            eqtd = Number(parseFloat(result).toString());
        } else {
            eqtd = Number(eqtdInput.value);
        }
        function makeCourseId(min, max) {
            const minCeiled = Math.ceil(min);
            const maxFloored = Math.floor(max);
            const courseId = Math.floor(
                Math.random() * (maxFloored - minCeiled + 1) + minCeiled
            );
            while (courseIds.has(courseId)) {
                makeCourseId();
            }
            return courseId;
        }

        const newCourse = {
            intitulé: courseInput.value,
            format: format,
            filière: filièreSelect.value,
            semestre: semestreSelect.value,
            volume: volume,
            eqtd: eqtd,
            nbgrp: nbgrp,
        };
        let checkCourse;
        if (!courseModify) {
            checkCourse = courseData.find(
                (c) =>
                    c.intitulé === courseInput.value &&
                    c.filière === filièreSelect.value &&
                    c.semestre === semestreSelect.value
            );
        } else if (courseModify) {
            checkCourse = courseData.find((c) => c.id === id);
        }
        if (checkCourse) {
            if (
                checkCourse.intitulé !== courseInput.value ||
                checkCourse.format !== format ||
                checkCourse.nbgrp !== nbgrp ||
                checkCourse.volume !== volume ||
                checkCourse.eqtd !== eqtd
            ) {
                newCourse.id = id;
                const dialog = document.createElement('dialog');
                const div = document.createElement('div');
                div.textContent =
                    'Ce cours existe déjà : mettre à jour les paramètres ?';
                dialog.appendChild(div);
                const yesBtn = document.createElement('button');
                yesBtn.classList.add('wishes-ui');
                yesBtn.textContent = 'Oui';
                dialog.appendChild(yesBtn);
                const noBtn = document.createElement('button');
                noBtn.classList.add('wishes-ui', 'reset-btn');
                noBtn.textContent = 'Non';
                noBtn.style.display = 'inline-block';
                dialog.appendChild(noBtn);
                yesBtn.onclick = () => {
                    const index = courseData.indexOf(checkCourse);
                    courseData.splice(index, 1, newCourse);
                    dialog.remove();
                    const addedCourseDiv =
                        document.getElementById('added-course-div');
                    addedCourseDiv.textContent = `${filièreSelect.value.toUpperCase()} ${
                        semestreSelect.value
                    } ${courseInput.value} — ${eqtd}h TD a été mis à jour.`;
                    addedCourseDiv.style.display = 'block';
                    setTimeout(() => {
                        addedCourseDiv.style.display = 'none';
                        addedCourseDiv.textContent = null;
                    }, 1000);
                    courseAddBtn.textContent = 'Ajouter';
                    const elts = Array.from(
                        document
                            .getElementById('course-add')
                            .querySelectorAll('select, input')
                    );
                    for (let elt of elts) {
                        if (elt.tagName === 'SELECT') {
                            elt.value =
                                elt.querySelector('option[selected]').value;
                        } else {
                            elt.value = null;
                        }
                        elt.removeAttribute('style');
                    }
                    volumeInput.disabled = true;
                    courseChanged = true;
                    getCourseIds();
                    compareData();
                    buildCourseList();
                    updateDisplay(newCourse);
                };
                noBtn.onclick = () => {
                    courseAddBtn.textContent = 'Ajouter';
                    const elts = Array.from(
                        document
                            .getElementById('course-add')
                            .querySelectorAll('select, input')
                    );
                    for (let elt of elts) {
                        if (elt.tagName === 'SELECT') {
                            elt.value =
                                elt.querySelector('option[selected]').value;
                        } else {
                            elt.value = null;
                        }
                        elt.removeAttribute('style');
                    }
                    volumeInput.disabled = true;
                    dialog.remove();
                    return;
                };
                document.body.appendChild(dialog);
                dialog.showModal();
            } else {
                window.alert('Un cours identique existe déjà');
                return;
            }
        } else {
            newCourse.id = makeCourseId(1, 9999);
            courseData.push(newCourse);
            const addedCourseDiv = document.getElementById('added-course-div');
            addedCourseDiv.textContent = `${filièreSelect.value.toUpperCase()} ${
                semestreSelect.value
            } ${courseInput.value} — ${eqtd}h TD a été ajouté`;
            addedCourseDiv.style.display = 'block';
            setTimeout(() => {
                addedCourseDiv.style.display = 'none';
                addedCourseDiv.textContent = null;
            }, 1000);
            courseInput.value = null;
            volumeInput.value = null;
            eqtdInput.value = null;
            courseChanged = true;
            courseAddBtn.textContent = 'Ajouter';
            const elts = Array.from(
                document
                    .getElementById('course-add')
                    .querySelectorAll('select, input')
            );
            for (let elt of elts) {
                elt.removeAttribute('style');
            }
            getCourseIds();
            compareData();
            buildCourseList();
            updateDisplay(newCourse);
        }
        document.getElementById('course-add').firstElementChild.textContent =
            'Ajouter un cours :';
        courseModify = false;
        courseInput.focus();
    }

    const courseCancelBtn = document.getElementById('course-add-cancel');
    courseCancelBtn.addEventListener('click', () => {
        const elts = document
            .getElementById('course-add')
            .querySelectorAll('select, input');
        for (let elt of elts) {
            if (elt.tagName === 'SELECT') {
                elt.value = elt.querySelector('option[selected]').value;
            } else if (elt.tagName === 'INPUT') {
                elt.value = null;
            }
            elt.removeAttribute('style');
        }
        volumeInput.disabled = true;
        courseAddBtn.textContent = 'Ajouter';
        courseCancelBtn.disabled = true;
        courseModify = false;
        courseCopy = false;
        document.getElementById(
            'course-add'
        ).firstElementChild.textContent = 'Ajouter un cours :';
    });

    // Course sorting functions
    function sortByFil(a, b) {
        const filA = a.filière.toLowerCase();
        const filB = b.filière.toLowerCase();
        return filA.localeCompare(filB);
    }
    function sortBySem(a, b) {
        const semA = a.semestre.toLowerCase();
        const semB = b.semestre.toLowerCase();
        return semA.localeCompare(semB);
    }
    function sortByInt(a, b) {
        const intA = a.intitulé.toLowerCase();
        const intB = b.intitulé.toLowerCase();
        return intA.localeCompare(intB);
    }

    // Modify or copy course
    courseModifyBtn.addEventListener('click', () => {
        courseCopy = false;
        courseModify = true;
        modifyCourse();
    });
    courseCopyBtn.addEventListener('click', () => {
        courseCopy = true;
        courseModify = false;
        modifyCourse();
    });
    function modifyCourse() {
        const intitulé = courseSelect2.value;
        const courses = courseData.filter(
            (c) =>
                c.filière === filièreSelect2.value &&
                c.semestre === semestreSelect2.value
        );
        const oldCourse = courses.find((c) => c.intitulé === intitulé);
        filièreSelect.value = oldCourse.filière;
        semestreSelect.value = oldCourse.semestre;
        formatSelect.value = oldCourse.format;
        courseInput.value = oldCourse.intitulé;
        if (oldCourse.volume !== 13 && oldCourse.volume !== 19.5) {
            volumeSelect.value = 'autre';
            volumeInput.value = oldCourse.volume;
        } else {
            volumeSelect.value = oldCourse.volume;
        }
        if (courseModify) {
            document.getElementById(
                'course-add'
            ).firstElementChild.textContent = 'Modifier le cours :';
            courseAddBtn.textContent = 'Modifier';
            id = oldCourse.id;
        } else if (courseCopy) {
            document.getElementById(
                'course-add'
            ).firstElementChild.textContent = 'Copier le cours :';
            courseAddBtn.textContent = 'Ajouter';
        }
        if (oldCourse.nbgrp) {
            grpInput.value = oldCourse.nbgrp;
        } else {
            adjustGrpNb();
        }
        eqtdInput.value = oldCourse.eqtd;
        const elts = Array.from(
            document
                .getElementById('course-add')
                .querySelectorAll('select, input')
        );
        for (let elt of elts) {
            if (courseModify) {
                elt.style.backgroundColor = '#e9fce9';
            } else if (courseCopy) {
                elt.style.backgroundColor = '#e6f5ff';
            }
        }
        courseInput.focus();
        courseCancelBtn.disabled = false;
    }

    // Delete course
    courseDeleteBtn.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment supprimer`;
        const div2 = document.createElement('div');
        div2.textContent = `${filièreSelect2.value} ${semestreSelect2.value} ${courseSelect2.value} ?`;
        div2.style.fontWeight = 'bold';
        const yesBtn = document.createElement('button');
        yesBtn.classList.add('wishes-ui', 'reset-btn');
        yesBtn.textContent = 'Oui';
        yesBtn.addEventListener('click', () => {
            dialog.remove();
            deleteCourse();
        });
        const noBtn = document.createElement('button');
        noBtn.classList.add('wishes-ui');
        noBtn.textContent = 'Non';
        noBtn.addEventListener('click', () => {
            dialog.remove();
        });
        document.body.appendChild(dialog);
        dialog.appendChild(div);
        dialog.appendChild(div2);
        dialog.appendChild(yesBtn);
        dialog.appendChild(noBtn);
        dialog.showModal();
    });
    function deleteCourse() {
        const intitulé = courseSelect2.value;
        const courses = courseData.filter(
            (c) =>
                c.filière === filièreSelect2.value &&
                c.semestre === semestreSelect2.value
        );
        const oldCourse = courses.find((c) => c.intitulé === intitulé);
        const index = courseData.indexOf(oldCourse);
        const deletedCourse = courseData.splice(index, 1);
        const deletedCourseDiv = document.getElementById('deleted-course-div');
        const deletedCourseSpan = document.getElementById(
            'deleted-course-span'
        );
        deletedCourseSpan.textContent = `${deletedCourse[0].filière} ${deletedCourse[0].semestre} ${deletedCourse[0].intitulé}`;
        deletedCourseDiv.style.display = 'block';
        setTimeout(() => {
            deletedCourseDiv.style.display = 'none';
            deletedCourseSpan.textContent = null;
        }, 1000);
        courseChanged = true;
        getCourseIds();
        buildCourseList();
        compareData();
        updateDisplay(oldCourse);
    }

    // Function to update course display in real time
    function updateDisplay(course) {
        if (coursesDisplay.style.maxHeight) {
            const fDisplays = Array.from(coursesDisplay.children);
            const fList = fDisplays.find(
                (d) => d.id === course.filière.toLowerCase()
            );
            if (fList) {
                const sDisplays = Array.from(fList.children);
                const sList = sDisplays.find(
                    (d) => d.id === course.semestre.toLowerCase()
                );
                if (sList) {
                    sList.innerHTML = null;
                    const courses = courseData.filter(
                        (c) =>
                            c.filière === course.filière &&
                            c.semestre === course.semestre
                    );
                    if (courses.length > 0) {
                        for (c of courses) {
                            const div = document.createElement('li');
                            div.classList.add('course');
                            div.style.fontWeight = 'normal';
                            div.textContent = `${c.intitulé} : ${c.volume}h ${c.format}`;
                            if (c.format !== 'TD') {
                                div.textContent += ` = ${c.eqtd}h éq. TD`;
                            }
                            if (c.nbgrp) {
                                div.textContent += ` — ${c.nbgrp} groupe(s)`;
                            }
                            sList.appendChild(div);
                            sList.style.maxHeight = sList.scrollHeight + 'px';
                            fList.style.maxHeight =
                                fList.scrollHeight + sList.scrollHeight + 'px';
                            coursesDisplay.style.maxHeight =
                                coursesDisplay.scrollHeight +
                                fList.scrollHeight +
                                sList.scrollHeight +
                                'px';
                        }
                    }
                }
            }
        }
    }

    // Upload changes
    saveChangesBtn.addEventListener('click', () => {
        saveChanges();
    });
    async function saveChanges() {
        const spinner = document.getElementById('spinner');
        if (!profChanged && !courseChanged) {
            window.alert("Aucun changement n'a été effectué");
            return;
        }
        let token = localStorage.getItem('github-token');
        if (!token) {
            const authDialog = document.getElementById('auth-dialog');
            authDialog.showModal();
            const authInput = document.getElementById('auth-input');
            const authSaveBtn = document.getElementById('auth-save-btn');
            authSaveBtn.onclick = () => {
                if (!authInput.value) {
                    spinner.style.display = 'none';
                    return;
                } else {
                    token = authInput.value.trim();
                    localStorage.setItem('github-token', token);
                    saveChanges();
                }
                authDialog.close();
            };
        }
        if (profChanged) {
            const url =
                'https://api.github.com/repos/fmoncomble/voeux/contents/profs.json';
            const fileString = JSON.stringify(teacherData);
            const encoder = new TextEncoder();
            const utf8Array = encoder.encode(fileString);
            const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
            const msg = 'profs';
            try {
                const btnText = saveChangesBtn.firstChild;
                btnText.textContent = null;
                spinner.style.display = 'inline-block';
                const success = await updateFile(url, finalFile, msg);
                if (success) {
                    spinner.style.display = 'none';
                    btnText.textContent = '✔︎';
                    saveChangesBtn.style.backgroundColor = 'green';
                    const saveMsg = document.getElementById('save-msg');
                    saveMsg.textContent = 'Fichier "' + msg + '" mis à jour\n';
                    setTimeout(() => {
                        saveChangesBtn.removeAttribute('style');
                        btnText.textContent = 'Synchroniser';
                        saveChangesBtn.disabled = true;
                        saveMsg.textContent = null;
                    }, 1000);
                    profChanged = false;
                }
            } catch (error) {
                throw new Error(error);
            }
        }
        if (courseChanged) {
            const url =
                'https://api.github.com/repos/fmoncomble/voeux/contents/cours.json';
            const fileString = JSON.stringify(courseData);
            const encoder = new TextEncoder();
            const utf8Array = encoder.encode(fileString);
            const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
            const msg = 'cours';
            try {
                const btnText = saveChangesBtn.firstChild;
                btnText.textContent = null;
                spinner.style.display = 'inline-block';
                const success = await updateFile(url, finalFile, msg);
                if (success) {
                    spinner.style.display = 'none';
                    btnText.textContent = '✔︎';
                    saveChangesBtn.style.backgroundColor = 'green';
                    const saveMsg = document.getElementById('save-msg');
                    saveMsg.textContent = 'Fichier "' + msg + '" mis à jour\n';
                    setTimeout(() => {
                        saveChangesBtn.removeAttribute('style');
                        btnText.textContent = 'Synchroniser';
                        saveChangesBtn.disabled = true;
                        saveMsg.textContent = null;
                    }, 1000);
                    courseChanged = false;
                }
            } catch (error) {
                throw new Error(error);
            }
        }
        async function updateFile(url, finalFile, msg) {
            const headers = new Headers({
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github+json',
                'Content-Type': 'application/json',
            });
            let sha;
            try {
                const getRes = await fetch(url, {
                    headers: headers,
                });
                if (!getRes || !getRes.ok) {
                    return;
                } else {
                    const data = await getRes.json();
                    sha = data.sha;
                }
            } catch (error) {
                throw new Error(error);
            }
            const body = JSON.stringify({
                message: 'Updated file',
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
                if (!saveRes || !saveRes.ok) {
                    window.alert('Erreur lors de la sauvegarde');
                    throw new Error(error);
                } else {
                    return true;
                }
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    // Display lists
    showProfs.onclick = () => {
        displayProfs();
    };
    function displayProfs(update) {
        const profsArrow = document.getElementById('profs-arrow');
        if (!profsDisplay.style.maxHeight || update) {
            profsDisplay.innerHTML = null;
            const statuses = Array.from(
                profStatusSelect.querySelectorAll('option')
            );
            for (let s of statuses) {
                const sList = document.createElement('ul');
                sList.classList.add('status-list');
                sList.id = `${s.value.toLowerCase()}`;
                const sSpan = document.createElement('li');
                sSpan.classList.add('status-span');
                sSpan.textContent = s.value.toUpperCase();
                const profs = teacherData.filter(
                    (t) => t.status.toLowerCase() === s.value.toLowerCase()
                );
                if (profs.length > 0) {
                    for (t of profs) {
                        const div = document.createElement('li');
                        div.textContent = `${t.name}`;
                        if (t.service) {
                            div.textContent += `, service de ${t.service}h TD`;
                        }
                        if (t.hc) {
                            div.textContent += ` (${t.hc} HC max)`;
                        }
                        sList.appendChild(div);
                    }
                    profsDisplay.appendChild(sSpan);
                    profsDisplay.appendChild(sList);
                }
                sList.style.maxHeight = sList.scrollHeight + 'px';
                profsDisplay.style.maxHeight =
                    profsDisplay.scrollHeight + sList.scrollHeight + 'px';
            }
            profsArrow.classList.remove('plain');
            profsArrow.classList.add('rotated');
            profsDisplay.style.maxHeight = profsDisplay.scrollHeight + 'px';
        } else if (profsDisplay.style.maxHeight) {
            profsDisplay.style.maxHeight = null;
            profsArrow.classList.remove('rotated');
            profsArrow.classList.add('plain');
        }
    }

    const showCourses = document.getElementById('show-courses');
    const coursesDisplay = document.getElementById('courses-display');
    showCourses.onclick = () => {
        displayCourses();
    };
    function displayCourses() {
        const coursesArrow = document.getElementById('courses-arrow');
        if (!coursesDisplay.style.maxHeight) {
            coursesDisplay.innerHTML = null;
            const filières = Array.from(
                filièreSelect.querySelectorAll('option')
            );
            const semestres = Array.from(
                semestreSelect.querySelectorAll('option')
            );
            for (f of filières) {
                const fDiv = document.createElement('ul');
                fDiv.classList.add('f-div');
                fDiv.classList.add('drawer');
                fDiv.id = `${f.value.toLowerCase()}`;
                const fSpan = document.createElement('li');
                fSpan.classList.add('f-span');
                fSpan.classList.add('show-hide');
                fSpan.textContent = f.value.toUpperCase();
                const arrowDiv = document.createElement('div');
                arrowDiv.classList.add('arrow');
                arrowDiv.textContent = '▶️';
                fSpan.appendChild(arrowDiv);
                fSpan.onclick = () => {
                    if (!fDiv.style.maxHeight) {
                        arrowDiv.classList.add('rotated');
                        arrowDiv.classList.remove('plain');
                        fDiv.style.maxHeight = fDiv.scrollHeight + 'px';
                        coursesDisplay.style.maxHeight =
                            coursesDisplay.scrollHeight +
                            fDiv.scrollHeight +
                            'px';
                    } else {
                        arrowDiv.classList.add('plain');
                        arrowDiv.classList.remove('rotated');
                        fDiv.style.maxHeight = null;
                    }
                };
                for (s of semestres) {
                    const sDiv = document.createElement('ul');
                    sDiv.classList.add('s-div');
                    sDiv.classList.add('drawer');
                    sDiv.id = `${s.value.toLowerCase()}`;
                    const sSpan = document.createElement('li');
                    sSpan.classList.add('s-span');
                    sSpan.classList.add('show-hide');
                    sSpan.textContent = s.value;
                    const arrowDiv = document.createElement('div');
                    arrowDiv.classList.add('arrow');
                    arrowDiv.textContent = '▶️';
                    sSpan.appendChild(arrowDiv);
                    sSpan.onclick = () => {
                        if (!sDiv.style.maxHeight) {
                            arrowDiv.classList.add('rotated');
                            arrowDiv.classList.remove('plain');
                            sDiv.style.maxHeight = sDiv.scrollHeight + 'px';
                            fDiv.style.maxHeight =
                                fDiv.scrollHeight + sDiv.scrollHeight + 'px';
                            coursesDisplay.style.maxHeight =
                                coursesDisplay.scrollHeight +
                                fDiv.scrollHeight +
                                sDiv.scrollHeight +
                                'px';
                        } else {
                            arrowDiv.classList.add('plain');
                            arrowDiv.classList.remove('rotated');
                            sDiv.style.maxHeight = null;
                        }
                    };
                    const courses = courseData.filter(
                        (c) => c.filière === f.value && c.semestre === s.value
                    );
                    if (courses.length > 0) {
                        for (c of courses) {
                            const div = document.createElement('li');
                            div.classList.add('course');
                            div.style.fontWeight = 'normal';
                            div.textContent = `${c.intitulé} : ${c.volume}h ${c.format}`;
                            if (c.format !== 'TD') {
                                div.textContent += ` = ${c.eqtd}h éq. TD`;
                            }
                            if (c.nbgrp) {
                                div.textContent += ` — ${c.nbgrp} groupe(s)`;
                            }
                            sDiv.appendChild(div);
                        }
                        coursesDisplay.appendChild(fSpan);
                        coursesDisplay.appendChild(fDiv);
                        fDiv.appendChild(sSpan);
                        fDiv.appendChild(sDiv);
                    }
                }
            }
            coursesArrow.classList.remove('plain');
            coursesArrow.classList.add('rotated');
            coursesDisplay.style.maxHeight = coursesDisplay.scrollHeight + 'px';
        } else if (coursesDisplay.style.maxHeight) {
            coursesArrow.classList.remove('rotated');
            coursesArrow.classList.add('plain');
            coursesDisplay.style.maxHeight = null;
        }
    }

    // Danger zone
    const dangerZoneHeader = document.getElementById('danger-zone-header');
    const dangerZone = document.getElementById('danger-zone');
    dangerZoneHeader.addEventListener('click', () => {
        const dangerBtns = dangerZone.querySelectorAll('button');
        for (let dB of dangerBtns) {
            if (dB.style.display === 'none') {
                dB.style.display = 'inline-block';
            } else {
                dB.style.display = 'none';
            }
        }
    });
    const eraseProfsBtn = document.getElementById('erase-profs-btn');
    eraseProfsBtn.addEventListener('click', () => {
        eraseDialog('profs');
    });
    const eraseCoursesBtn = document.getElementById('erase-courses-btn');
    eraseCoursesBtn.addEventListener('click', () => {
        eraseDialog('cours');
    });
    function eraseDialog(e) {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment écraser le fichier ${e} ?
Cette opération est irréversible.`;
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Oui';
        yesBtn.classList.add('wishes-ui', 'danger-btn');
        yesBtn.addEventListener('click', () => {
            if (e === 'profs') {
                teacherData = [];
                profChanged = true;
                buildProfList();
            } else if (e === 'cours') {
                courseData = [];
                courseChanged = true;
                buildCourseList();
            }
            saveChanges();
            dialog.remove();
        });
        const noBtn = document.createElement('button');
        noBtn.textContent = 'Non';
        noBtn.classList.add('wishes-ui');
        noBtn.addEventListener('click', () => {
            dialog.remove();
        });
        dialog.appendChild(div);
        dialog.appendChild(yesBtn);
        dialog.appendChild(noBtn);
        document.body.appendChild(dialog);
        dialog.showModal();
    }

    // Compare files
    async function compareData() {
        let checkTeacherData = await getFile(teacherDBUrl);
        let checkCourseData = await getFile(courseDBUrl);
        if (
            teacherData !== checkTeacherData ||
            courseData !== checkCourseData
        ) {
            saveChangesBtn.disabled = false;
        } else {
            saveChangesBtn.disabled = true;
        }
    }
});
