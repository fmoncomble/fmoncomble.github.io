document.addEventListener('DOMContentLoaded', async () => {
    const profAddInput = document.getElementById('prof-name');
    const profStatusSelect = document.getElementById('status-select');
    const profAddBtn = document.getElementById('prof-add-btn');
    const profDeleteInput = document.getElementById('prof-name-2');
    const profDeleteBtn = document.getElementById('prof-delete-btn');
    const filièreSelect = document.getElementById('course-filière');
    const semestreSelect = document.getElementById('course-semestre');
    const formatSelect = document.getElementById('format-select');
    const volumeInput = document.getElementById('volume-input');
    const courseInput = document.getElementById('course-name');
    const courseAddBtn = document.getElementById('course-add-btn');
    const filièreSelect2 = document.getElementById('course-filière-2');
    const semestreSelect2 = document.getElementById('course-semestre-2');
    const courseSelect2 = document.getElementById('course-name-2');
    const courseDeleteBtn = document.getElementById('course-delete-btn');
    const saveChangesBtn = document.getElementById('save-changes-btn');
    const profList = document.getElementById('prof-list');

    // Get profs and cours files
    async function getFile(url) {
        try {
            const res = await fetch(url);
            if (res && res.ok) {
                const data = await res.json();
                return data;
            } else {
                window.alert('Could not retrieve file at ' + url);
                return null;
            }
        } catch (error) {
            console.error(error);
        }
    }

    const teacherDBUrl =
        'https://raw.githubusercontent.com/fmoncomble/fmoncomble.github.io/main/voeux/profs.json';
    const courseDBUrl =
        'https://raw.githubusercontent.com/fmoncomble/fmoncomble.github.io/main/voeux/cours.json';
    const teacherData = await getFile(teacherDBUrl);
    const courseData = await getFile(courseDBUrl);

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
    buildProfList();

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
    buildCourseList();

    // Add prof
    let profChanged = false;
    profAddBtn.addEventListener('click', () => {
        addProf();
    });
    function addProf() {
        if (!profAddInput.value) {
            window.alert('Entrez un nom');
            profAddInput.focus();
            return;
        }
        const customService = Number(document.getElementById('custom-service').value);
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
        console.log('Creating new prof: ', newProf);
        const checkProf = teacherData.find(
            (t) => t.name === profAddInput.value
        );
        if (checkProf) {
            if (checkProf.status !== profStatusSelect.value) {
                const dialog = document.createElement('dialog');
                const div = document.createElement('div');
                div.textContent =
                    'Il y a déjà un·e enseignant·e à ce nom : mettre à jour le statut ?';
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
            const addedProf = document.getElementById('added-prof');
            addedProf.textContent = `${profAddInput.value}, ${profStatusSelect.value}`;
            addedProfDiv.style.display = 'block';
            profAddInput.value = null;
            profChanged = true;
        }
        buildProfList();
    }

    // Delete prof
    profDeleteBtn.addEventListener('click', () => {
        deleteProf();
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
        profDeleteInput.value = null;
        profChanged = true;
        buildProfList();
    }

    // Add course
    let courseChanged = false;
    courseAddBtn.addEventListener('click', () => {
        addCourse();
    });
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
        let multiplier;
        if (format === 'CM') {
            multiplier = 1.5;
        } else if (format === 'TD') {
            multiplier = 1;
        } else if (format === 'TP') {
            multiplier = 1 / 1.5;
        }
        const eqtd = volume * multiplier;

        const newCourse = {
            intitulé: courseInput.value,
            format: format,
            filière: filièreSelect.value,
            semestre: semestreSelect.value,
            volume: volume,
            eqtd: eqtd,
        };
        const checkCourse = courseData.find(
            (c) =>
                c.intitulé === courseInput.value &&
                c.filière === filièreSelect.value &&
                c.semestre === semestreSelect.value
        );
        console.log('Cours existant : ', checkCourse);
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
                    console.log('Courses after replace: ', courseData);
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
            courseData.push(newCourse);
            courseData.sort((a, b) => {
                const intA = a.intitulé.toLowerCase();
                const intB = b.intitulé.toLowerCase();
                if (intA < intB) {
                    return -1;
                }
                if (intA > intB) {
                    return 1;
                }
                return 0;
            });
            const addedCourseDiv = document.getElementById('added-course-div');
            const addedCourseSpan =
                document.getElementById('added-course-span');
            addedCourseSpan.textContent = `${filièreSelect.value} ${semestreSelect.value} ${courseInput.value}`;
            addedCourseDiv.style.display = 'block';
            courseInput.value = null;
            volumeInput.value = null;
            courseChanged = true;
        }
        buildCourseList();
    }

    // Delete course
    courseDeleteBtn.addEventListener('click', () => {
        deleteCourse();
    });
    function deleteCourse() {
        const intitulé = courseSelect2.value;
        const courses = courseData.filter(
            (c) =>
                c.filière === filièreSelect2.value &&
                c.semestre === semestreSelect2.value
        );
        const oldCourse = courses.find((c) => (c.intitulé = intitulé));
        console.log('Course to delete: ', oldCourse);
        const index = courseData.indexOf(oldCourse);
        const deletedCourse = courseData.splice(index, 1);
        console.log('Deleted course: ', deletedCourse);
        console.log('Courses after deletion: ', courseData);
        const deletedCourseDiv = document.getElementById('deleted-course-div');
        const deletedCourseSpan = document.getElementById(
            'deleted-course-span'
        );
        deletedCourseSpan.textContent = `${filièreSelect2.value} ${semestreSelect2.value} ${intitulé}`;
        deletedCourseDiv.style.display = 'block';
        courseChanged = true;
        buildCourseList();
    }

    // Upload changes
    saveChangesBtn.addEventListener('click', () => {
        saveChanges();
    });
    async function saveChanges() {
        let token = localStorage.getItem('github-token');
        console.log('Token: ', token);
        if (!token) {
            const authDialog = document.getElementById('auth-dialog');
            authDialog.showModal();
            const authInput = document.getElementById('auth-input');
            const authSaveBtn = document.getElementById('auth-save-btn');
            authSaveBtn.onclick = () => {
                if (!authInput.value) {
                    return;
                } else {
                    token = authInput.value.trim();
                    localStorage.setItem('github-token', token);
                }
                authDialog.close();
            };
        }
        if (!profChanged && !courseChanged) {
            window.alert('Aucun changement effectué');
            return;
        }
        if (profChanged) {
            const url =
                'https://api.github.com/repos/fmoncomble/fmoncomble.github.io/contents/voeux/profs.json';
            const fileString = JSON.stringify(teacherData);
            const encoder = new TextEncoder();
            const utf8Array = encoder.encode(fileString);
            const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
            const msg = 'profs';
            try {
                await updateFile(url, finalFile, msg);
                profChanged = false;
            } catch (error) {
                throw new Error(error);
            }
        }
        if (courseChanged) {
            const url =
                'https://api.github.com/repos/fmoncomble/fmoncomble.github.io/contents/voeux/cours.json';
            const fileString = JSON.stringify(courseData);
            const encoder = new TextEncoder();
            const utf8Array = encoder.encode(fileString);
            const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
            const msg = 'cours';
            try {
                await updateFile(url, finalFile, msg);
                courseChanged = false;
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
                    const saveMsg = document.getElementById('save-msg');
                    saveMsg.textContent = saveMsg.textContent +=
                        'Fichier ' + msg + ' mis à jour\n';
                }
            } catch (error) {
                throw new Error(error);
            }
        }
    }
});
