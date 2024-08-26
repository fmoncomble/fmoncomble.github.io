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
    const courseDeleteBtn = document.getElementById('course-delete-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const profList = document.getElementById('prof-list');

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
        token = localStorage.getItem('github-token');
        if (token) {
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
        } else {
            authDiv.style.display = 'none';
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
    }
    checkToken();

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('github-token');
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

    /// Build available course list according to filière and semestre
    function buildCourseList() {
        const options = Array.from(courseSelect2.querySelectorAll('option'));
        for (o of options) {
            o.remove();
        }
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
        let newProf;
        if (customService) {
            newProf = {
                name: profAddInput.value,
                status: profStatusSelect.value,
                service: customService,
            };
        } else {
            newProf = {
                name: profAddInput.value,
                status: profStatusSelect.value,
            };
        }
        const checkProf = teacherData.find(
            (t) => t.name === profAddInput.value
        );
        if (checkProf) {
            if (
                checkProf.status !== profStatusSelect.value ||
                checkProf.service !== customService
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
                noBtn.classList.add('wishes-ui');
                noBtn.textContent = 'Non';
                noBtn.style.display = 'inline-block';
                dialog.appendChild(noBtn);
                yesBtn.onclick = () => {
                    const index = teacherData.indexOf(checkProf);
                    teacherData.splice(index, 1, newProf);
                    dialog.close();
                    const addedProfDiv =
                        document.getElementById('added-prof-div');
                    addedProfDiv.textContent = `${newProf.name} a été modifié·e.`;
                    addedProfDiv.style.display = 'block';
                    setTimeout(() => {
                        addedProfDiv.style.display = 'none';
                        addedProfDiv.textContent = null;
                    }, 1000);
                    profChanged = true;
                };
                noBtn.onclick = () => {
                    dialog.close();
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
                const intA = a.name.split(' ')[1].toLowerCase();
                const intB = b.name.split(' ')[1].toLowerCase();
                if (intA < intB) {
                    return -1;
                }
                if (intA > intB) {
                    return 1;
                }
                return 0;
            });
            const addedProfDiv = document.getElementById('added-prof-div');
            addedProfDiv.textContent = `${profAddInput.value}, ${profStatusSelect.value} a été ajouté·e`;
            addedProfDiv.style.display = 'block';
            setTimeout(() => {
                addedProfDiv.style.display = 'none';
                addedProfDiv.textContent = null;
            }, 1000);
            profAddInput.value = null;
            profChanged = true;
        }
        profModify = false;

        buildProfList();
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
        profModify = false;
    });

    // Modify prof
    profModifyBtn.addEventListener('click', () => {
        modifyProf();
    });
    function modifyProf() {
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
    }

    // Delete prof
    profDeleteBtn.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment supprimer ${profDeleteInput.value} ?`;
        const yesBtn = document.createElement('button');
        yesBtn.classList.add('wishes-ui', 'reset-btn');
        yesBtn.textContent = 'Oui';
        yesBtn.addEventListener('click', () => {
            dialog.close();
            deleteProf();
        });
        const noBtn = document.createElement('button');
        noBtn.classList.add('wishes-ui');
        noBtn.textContent = 'Non';
        noBtn.addEventListener('click', () => {
            dialog.close();
        });
        document.body.appendChild(dialog);
        dialog.appendChild(div);
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
        buildProfList();
    }

    // Add course
    let courseChanged = false;
    courseAddBtn.addEventListener('click', () => {
        addCourse();
    });
    volumeInput.addEventListener('input', () => {
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
        let result = (volumeInput.value * multiplier).toFixed(2);
        eqtdInput.value = Number(parseFloat(result).toString());
    });
    formatSelect.addEventListener('change', () => {
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
        let result = (volumeInput.value * multiplier).toFixed(2);
        eqtdInput.value = Number(parseFloat(result).toString());
    });
    let id;
    let courseModify = false;
    function addCourse() {
        const format = formatSelect.value;
        const volume = Number(volumeInput.value.replace(',', '.'));
        if (!courseInput.value || !volume) {
            window.alert('Entrez un intitulé et/ou le volume horaire');
            if (!courseInput.value) {
                courseInput.focus();
            } else if (!volume) {
                volumeInput.focus();
            }
            return;
        }
        const nbgrp = Number(grpInput.value);
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
            eqtd = (volume * multiplier).toFixed(2);
        } else {
            eqtd = Number(eqtdInput.value).toFixed(2);
        }
        // let id = makeCourseId(1, 9999);
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
            // id: id,
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
                checkCourse.format !== format ||
                checkCourse.volume !== volume
            ) {
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
                noBtn.classList.add('wishes-ui');
                noBtn.textContent = 'Non';
                noBtn.style.display = 'inline-block';
                dialog.appendChild(noBtn);
                yesBtn.onclick = () => {
                    const index = courseData.indexOf(checkCourse);
                    courseData.splice(index, 1, newCourse);
                    dialog.close();
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
                            elt.value = elt.querySelectorAll('option')[0].value;
                        } else {
                            elt.value = null;
                        }
                        elt.removeAttribute('style');
                    }
                    courseChanged = true;
                };
                noBtn.onclick = () => {
                    dialog.close();
                    return;
                };
                document.body.appendChild(dialog);
                dialog.showModal();
            } else {
                window.alert('Ce cours existe déjà');
                return;
            }
        } else {
            newCourse.id = makeCourseId(1, 9999);
            courseData.push(newCourse);
            courseData.sort(sortByInt);
            courseData.sort(sortBySem);
            courseData.sort(sortByFil);
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
        }
        courseModify = false;
        buildCourseList();
    }

    const courseCancelBtn = document.getElementById('course-add-cancel');
    courseCancelBtn.addEventListener('click', () => {
        const elts = document
            .getElementById('course-add')
            .querySelectorAll('select, input');
        for (let elt of elts) {
            if (elt.tagName === 'SELECT') {
                elt.value = elt.querySelectorAll('option')[0].value;
            } else if (elt.tagName === 'INPUT') {
                elt.value = null;
            }
            elt.removeAttribute('style');
        }
        courseAddBtn.textContent = 'Ajouter';
        courseCancelBtn.disabled = true;
        courseModify = false;
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

    // Modify course
    courseModifyBtn.addEventListener('click', () => {
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
        volumeInput.value = oldCourse.volume;
        id = oldCourse.id;
        if (oldCourse.nbgrp) {
            grpInput.value = oldCourse.nbgrp;
        }
        eqtdInput.value = oldCourse.eqtd;
        courseAddBtn.textContent = 'Modifier';
        const elts = Array.from(
            document
                .getElementById('course-add')
                .querySelectorAll('select, input')
        );
        for (let elt of elts) {
            elt.style.backgroundColor = '#e9fce9';
        }
        courseModify = true;
        courseInput.focus();
    }

    // Delete course
    courseDeleteBtn.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment supprimer ${courseSelect2.value} ?`;
        const yesBtn = document.createElement('button');
        yesBtn.classList.add('wishes-ui', 'reset-btn');
        yesBtn.textContent = 'Oui';
        yesBtn.addEventListener('click', () => {
            dialog.close();
            deleteCourse();
        });
        const noBtn = document.createElement('button');
        noBtn.classList.add('wishes-ui');
        noBtn.textContent = 'Non';
        noBtn.addEventListener('click', () => {
            dialog.close();
        });
        document.body.appendChild(dialog);
        dialog.appendChild(div);
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
                spinner.style.display = 'inline-block';
                const success = await updateFile(url, finalFile, msg);
                if (success) {
                    spinner.style.display = 'none';
                    saveChangesBtn.style.backgroundColor = 'green';
                    const saveMsg = document.getElementById('save-msg');
                    saveMsg.textContent = saveMsg.textContent +=
                        'Fichier "' + msg + '" mis à jour\n';
                    setTimeout(() => {
                        saveChangesBtn.removeAttribute('style');
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
                spinner.style.display = 'inline-block';
                const success = await updateFile(url, finalFile, msg);
                if (success) {
                    spinner.style.display = 'none';
                    saveChangesBtn.style.backgroundColor = 'green';
                    const saveMsg = document.getElementById('save-msg');
                    saveMsg.textContent = saveMsg.textContent +=
                        'Fichier "' + msg + '" mis à jour\n';
                    setTimeout(() => {
                        saveChangesBtn.removeAttribute('style');
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
    const showProfs = document.getElementById('show-profs');
    const profsDisplay = document.getElementById('profs-display');
    showProfs.onclick = () => {
        displayProfs();
    };
    function displayProfs() {
        const profsArrow = document.getElementById('profs-arrow');
        if (!profsDisplay.style.maxHeight) {
            profsDisplay.innerHTML = null;
            for (t of teacherData) {
                const div = document.createElement('div');
                div.textContent = `${t.name}, ${t.status}`;
                if (t.service) {
                    div.textContent += `, service de ${t.service}h TD`;
                }
                profsDisplay.appendChild(div);
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
                const fDiv = document.createElement('div');
                fDiv.classList.add('f-div');
                fDiv.classList.add('drawer');
                const fSpan = document.createElement('h3');
                fSpan.classList.add('f-span');
                fSpan.classList.add('show-hide');
                fSpan.textContent = f.value.toUpperCase();
                fSpan.onclick = () => {
                    if (!fDiv.style.maxHeight) {
                        fDiv.style.maxHeight = fDiv.scrollHeight + 'px';
                        coursesDisplay.style.maxHeight =
                            coursesDisplay.scrollHeight +
                            fDiv.scrollHeight +
                            'px';
                    } else {
                        fDiv.style.maxHeight = null;
                    }
                };
                for (s of semestres) {
                    const sDiv = document.createElement('div');
                    sDiv.classList.add('s-div');
                    sDiv.classList.add('drawer');
                    sDiv.style.marginLeft = '2rem';
                    const sSpan = document.createElement('h4');
                    sSpan.style.marginLeft = '2rem';
                    sSpan.classList.add('s-span');
                    sSpan.classList.add('show-hide');
                    sSpan.textContent = s.value;
                    sSpan.onclick = () => {
                        if (!sDiv.style.maxHeight) {
                            sDiv.style.maxHeight = sDiv.scrollHeight + 'px';
                            fDiv.style.maxHeight =
                                fDiv.scrollHeight + sDiv.scrollHeight + 'px';
                            coursesDisplay.style.maxHeight =
                                coursesDisplay.scrollHeight +
                                fDiv.scrollHeight +
                                sDiv.scrollHeight +
                                'px';
                        } else {
                            sDiv.style.maxHeight = null;
                        }
                    };
                    const courses = courseData.filter(
                        (c) => c.filière === f.value && c.semestre === s.value
                    );
                    if (courses.length > 0) {
                        for (c of courses) {
                            const div = document.createElement('div');
                            div.classList.add('course');
                            div.style.fontWeight = 'normal';
                            div.style.marginLeft = '2rem';
                            div.textContent = `${c.filière} ${c.semestre} ${c.intitulé} ${c.eqtd}h TD`;
                            if (c.nbgrp) {
                                div.textContent += ` — ${c.nbgrp} groupes`;
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
});
