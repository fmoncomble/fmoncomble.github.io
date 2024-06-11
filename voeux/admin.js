document.addEventListener('DOMContentLoaded', async () => {
    const tokenInput = document.getElementById('token-input');
    const authSaveBtn = document.getElementById('auth-save');
    const fileInput = document.getElementById('file-input');
    const eraseBtn = document.getElementById('erase-btn');
    const compileBtn = document.getElementById('compile-btn');
    const courseList = document.getElementById('course-list');
    const saveBtn = document.getElementById('save-btn');

    // Manage authentication
    authSaveBtn.addEventListener('click', () => saveToken());
    let token;
    function checkToken() {
        token = localStorage.getItem('github-token');
        if (token) {
            tokenInput.placeholder = 'Jeton enregistré';
            tokenInput.style.outline = 'solid 1px green';
            authSaveBtn.textContent = 'Réinitialiser';
            checkVoeuxFile();
        } else {
            tokenInput.placeholder = "Jeton d'authentification";
            tokenInput.removeAttribute('style');
            authSaveBtn.textContent = 'Enregistrer';
            tokenInput.value = null;
        }
    }
    checkToken();
    async function saveToken() {
        if ((token && tokenInput.value) || !token) {
            localStorage.setItem('github-token', tokenInput.value);
            tokenInput.placeholder = 'Jeton enregistré';
            tokenInput.value = null;
            tokenInput.style.outline = 'solid 1px green';
            authSaveBtn.textContent = 'Réinitialiser';
            checkVoeuxFile();
        } else if (token) {
            localStorage.removeItem('github-token');
            tokenInput.removeAttribute('style');
            tokenInput.value = null;
            authSaveBtn.textContent = 'Enregistrer';
            tokenInput.placeholder = "Jeton d'authentification";
        }
        authSaveBtn.style.backgroundColor = 'green';
        setTimeout(() => {
            authSaveBtn.removeAttribute('style');
        }, 1000);
    }

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
        console.log('Fichier de services ? ', res.ok);
        if (!res) {
            window.alert('Impossible de récupérer le fichier de services');
            return;
        } else if (res.status === 401) {
            window.alert("Vérifiez votre jeton d'authentification");
            return;
        } else if (res.status === 404) {
            const fileExist = document.getElementById('file-exist');
            fileExist.textContent =
                "Aucun fichier de services n'a encore été créé";
            fileExist.style.display = 'block';
        } else {
            const data = await res.json();
            sha = data.sha;
            console.log('SHA = ', sha);
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
            console.log('Existing services file: ', servicesFile);
            eraseBtn.style.display = 'inline';
            compileBtn.textContent = 'Ajouter';
            saveBtn.textContent = 'Mettre à jour';
        }
    }

    // Listen to erase button ('Écraser')
    eraseBtn.addEventListener('click', () => {
        servicesFile = [];
        compileWishes();
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

    let json;
    function readWishes(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                json = JSON.parse(reader.result);
                resolve();
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
        for (let f of files) {
            await readWishes(f);
            const prof = json.Name;
            const existingProf = servicesFile.find((s) => s.Name === prof);
            if (existingProf) {
                console.log(
                    `Prof ${prof} already in file: ${JSON.stringify(
                        existingProf
                    )}`
                );
                json.Cours.forEach((c) => existingProf.Cours.push(c));
            } else {
                servicesFile.push(json);
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
            }
        }
        console.log('Resulting services file: ', servicesFile);
        compileBtn.style.backgroundColor = 'green';
        setTimeout(() => {
            compileBtn.removeAttribute('style');
        }, 1000);
        saveBtn.style.display = 'block';
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
            }
        }

        const courseItems = new Set();
        for (let c of courses) {
            const courseId = `${c.filière} — ${c.semestre} — ${c.intitulé}`;
            let newItem;
            let courseTeachers;
            let reqNb;
            if (c.format === 'CM') {
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
                }
            }
            if (!courseItems.has(courseId)) {
                courseItems.add(courseId);
                newItem = courseItem.cloneNode(true);
                const courseName = newItem.querySelector('span#course-name');
                courseTeachers = newItem.querySelector('span#course-teachers');
                courseName.textContent = `${c.filière} — ${c.semestre} — ${c.intitulé}`;
                courseTeachers.textContent = c.teacher;
                const courseNumberSpan =
                    newItem.querySelector('span#course-number');
                const courseNb = courses.filter(
                    (i) => i.intitulé === c.intitulé
                ).length;
                courseNumberSpan.textContent = `${courseNb} / ${reqNb}`;
                if (logic === 'course') {
                    if (courseNb < reqNb) {
                        courseNumberSpan.style.color = 'orange';
                    } else if (courseNb === reqNb) {
                        courseNumberSpan.style.color = 'green';
                    } else if (courseNb > reqNb) {
                        courseNumberSpan.style.color = 'red';
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
                    courseTeachers.textContent += `, ${c.teacher}`;
                }
                const courseNumberSpan =
                    existingItem.querySelector('span#course-number');
                const courseNb = courses.filter(
                    (i) => i.intitulé === c.intitulé
                ).length;
                courseNumberSpan.textContent = `${courseNb} / ${reqNb}`;
                if (logic === 'course') {
                    if (courseNb < reqNb) {
                        courseNumberSpan.style.color = 'orange';
                    } else if (courseNb === reqNb) {
                        courseNumberSpan.style.color = 'green';
                    } else if (courseNb > reqNb) {
                        courseNumberSpan.style.color = 'red';
                        courseNumberSpan.textContent += ' ⚠️';
                    }
                }
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
                    window.alert("Erreur : " + saveRes.message);
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
    const profFile = await getProfFile();
    async function getProfFile() {
        try {
            const url =
                'https://raw.githubusercontent.com/fmoncomble/fmoncomble.github.io/main/voeux/profs.json';
            const res = await fetch(url);
            if (!res || !res.ok) {
                console.error('Could not retrieve teacher file');
            } else {
                const data = await res.json();
                return data;
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
    buildProfList();

    // Handle course selection for modifying teacher service
    const courseFile = await getCourseFile();
    async function getCourseFile() {
        try {
            const url =
                'https://raw.githubusercontent.com/fmoncomble/fmoncomble.github.io/main/voeux/cours.json';
            const res = await fetch(url);
            if (!res || !res.ok) {
                console.error('Could not retrieve course file');
            } else {
                const data = await res.json();
                return data;
            }
        } catch (error) {
            throw new Error(error);
        }
    }

    const filièreSelect2 = document.getElementById('filière-select-2');
    const semestreSelect2 = document.getElementById('semestre-select-2');
    const courseAddSelect = document.getElementById('course-add-select');
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
    buildCourseAddSelect();
    semestreSelect2.addEventListener('change', () => {
        buildCourseAddSelect();
    });

    const profInput2 = document.getElementById('prof-input-2');
    const goProfBtn = document.getElementById('go-prof-btn');
    goProfBtn.addEventListener('click', () => {
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
        const filière = filièreSelect2.value;
        const semestre = semestreSelect2.value;
        const courseName = courseAddSelect.value;
        const courseToAdd = courseFile.find(
            (c) =>
                c.intitulé === courseName &&
                c.filière === filière &&
                c.semestre === semestre
        );
        const profEntry = servicesFile.find((p) => p.Name === prof);
        const courses = profEntry.Cours;
        courses.push(courseToAdd);
        courses.sort((a, b) => {
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
        buildCourseDeleteSelect();
        const courseAddDiv = document.getElementById('course-add-div');
        const courseAddSpan = document.getElementById('course-add-span');
        const data = computeServiceVol(profEntry);
        const baseService = data[0];
        const totalService = data[1];
        courseAddSpan.textContent = `${filière} ${semestre} ${courseName} a été ajouté au service de ${prof}. Total : ${totalService} sur ${baseService}`;
        courseAddDiv.style.display = 'block';
    }

    const courseDeleteBtn = document.getElementById('course-delete-btn');
    courseDeleteBtn.addEventListener('click', () => {
        deleteCourse();
    });
    function deleteCourse() {
        const prof = profInput2.value;
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
        const courseDeleteDiv = document.getElementById('course-delete-div');
        const courseDeleteSpan = document.getElementById('course-delete-span');
        const data = computeServiceVol(profEntry);
        const baseService = data[0];
        const totalService = data[1];
        courseDeleteSpan.textContent = `${filière} ${semestre} ${courseName} a été supprimé du service de ${prof}. Total : ${totalService} sur ${baseService}`;
        courseDeleteDiv.style.display = 'block';
    }

    // Calculer service total et service dû
    function computeServiceVol(prof) {
        const profFromFile = profFile.find((p) => p.name === prof.Name);
        let baseService = profFromFile.service;
        if (!baseService) {
            console.log('Base service not found: ', baseService);
            const profStatus = profFromFile.status;
            console.log(`${prof.Name} est ${profStatus}`);
            if (profStatus === 'PR' || profStatus === 'MCF') {
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
        console.log('Base service: ', baseService);
        let totalService = 0;
        console.log('Cours à additionner: ', prof.Cours);
        for (c of prof.Cours) {
            console.log('Volume de ce cours: ', c.intitulé + ' ' + c.eqtd);
            totalService += Number(c.eqtd);
        }
        totalService = Number(totalService);
        console.log('Total service: ', totalService);
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
});
