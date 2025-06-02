document.addEventListener('DOMContentLoaded', async () => {
    const authDiv = document.getElementById('auth-div');
    const fileInput = document.getElementById('file-input');
    const dropboxBtn = document.getElementById('get-dropbox-files');
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
    const courseListDiv = document.querySelector('div.course-list-div');

    // Manage authentication
    let token;
    let profFile;
    let courseFile;
    async function checkToken() {
        token = localStorage.getItem('github-admin-token');
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
                localStorage.removeItem('github-admin-token');
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
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (!token && tokenParam) {
        localStorage.setItem('github-admin-token', tokenParam);
        window.location.replace(
            'https://fmoncomble.github.io/voeux/admin.html'
        );
        // window.location.replace('http://localhost:8000/voeux/admin.html');
    }

    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', () => {
        localStorage.removeItem('github-admin-token');
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
            localStorage.setItem('github-admin-token', token);
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
                localStorage.setItem('github-admin-token', token);
                checkToken();
            }
            authDialog.close();
        }
    });
    // Retrieve existing services file
    let voeux;
    let sha;
    let remoteFile = [];
    let servicesFile = [];
    async function checkVoeuxFile() {
        const url =
            'https://api.github.com/repos/fmoncomble/voeux/contents/services.json?ref=main';
        const token = localStorage.getItem('github-admin-token');
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
            remoteFile = JSON.parse(voeux);
            servicesFile = JSON.parse(voeux);
            if (servicesFile.length === 0) {
                fileExist.textContent += `(le fichier est vide)`;
            }
        }
    }

    const fileName = document.getElementById('file-name');
    let ok = false;
    // Listen to erase button ('Écraser')
    eraseBtn.addEventListener('click', () => {
        if (!files) {
            window.alert(
                'Chargez un ou plusieurs fichiers de vœux individuels'
            );
        } else {
            const eraseDialog = document.createElement('dialog');
            const div = document.createElement('div');
            div.innerHTML =
                'Voulez-vous vraiment écraser les données existantes ?';
            const yesBtn = document.createElement('button');
            yesBtn.classList.add('wishes-ui', 'reset-btn');
            yesBtn.textContent = 'Oui';
            const noBtn = document.createElement('button');
            noBtn.classList.add('wishes-ui');
            noBtn.textContent = 'Non';
            yesBtn.addEventListener('click', async () => {
                servicesFile = [];
                eraseDialog.remove();
                ok = await compileWishes();
                if (ok) {
                    eraseBtn.style.backgroundColor = 'green';
                    setTimeout(() => {
                        eraseBtn.removeAttribute('style');
                        fileName.textContent = null;
                        const actionChoiceDiv =
                            document.getElementById('action-choice');
                        actionChoiceDiv.style.display = 'none';
                        saveBtn.style.display = 'inline-block';
                    }, 1000);
                    compareData();
                }
            });
            noBtn.addEventListener('click', () => {
                eraseDialog.remove();
            });
            eraseDialog.appendChild(div);
            eraseDialog.appendChild(yesBtn);
            eraseDialog.appendChild(noBtn);
            document.body.appendChild(eraseDialog);
            eraseDialog.showModal();
        }
    });

    // Load individual wish files
    let files = [];
    fileInput.addEventListener('change', () => {
        const fileList = [];
        files = fileInput.files;
        if (files.length > 0) {
            for (let f of files) {
                fileList.push(f.name);
            }
            fileName.textContent = fileList.join(', ');
            const actionChoiceDiv = document.getElementById('action-choice');
            actionChoiceDiv.style.display = 'block';
            eraseBtn.style.display = 'inline';
            if (servicesFile.length > 0) {
                compileBtn.textContent = 'Mettre à jour';
            }
        }
    });

    // Retrieve wish files from Dropbox
    let attempts = 0;
    dropboxBtn.addEventListener('click', async () => {
        const spinner = document.createElement('span');
        spinner.classList.add('spinner');
        spinner.style.display = 'inline-block';
        dropboxBtn.innerHTML = null;
        dropboxBtn.disabled = true;
        dropboxBtn.appendChild(spinner);
        await getWishFiles();
    });
    async function getDropboxToken() {
        const form = new FormData();
        form.append('action', 'get_token');
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
    async function getWishFiles() {
        // Get dropbox token
        let dropboxToken = await getDropboxToken();
        if (!dropboxToken) {
            dropboxBtn.textContent = 'Importer depuis Dropbox';
            dropboxBtn.disabled = false;
            return;
        }
        // List files in Dropbox folder
        attempts++;
        let formData = new FormData();
        formData.append('action', 'list_folder');
        formData.append('token', dropboxToken);
        let res = await fetch(
            'https://prendrelangue.fr/wp-content/uploads/voeux/dropbox.php',
            {
                method: 'POST',
                body: formData,
            }
        );
        if (res.ok) {
            let data = await res.json();
            if (data.success) {
                let fileEntries = data.message.entries;
                if (fileEntries.length > 0) {
                    dropboxBtn.textContent = 'Fichiers trouvés';
                    const fileList = [];
                    const date = new Date().toISOString().split('-')[0];
                    for (let entry of fileEntries) {
                        if (
                            entry['.tag'] === 'file' &&
                            entry.name.endsWith(`_${date}.json`)
                        ) {
                            dropboxBtn.textContent = `Fichier ${
                                fileEntries.indexOf(entry) + 1
                            }/${fileEntries.length}...`;
                            let entryFormData = new FormData();
                            entryFormData.append('action', 'get_file');
                            entryFormData.append('token', dropboxToken);
                            entryFormData.append('path', entry.path_lower);
                            let res = await fetch(
                                'https://prendrelangue.fr/wp-content/uploads/voeux/dropbox.php',
                                {
                                    method: 'POST',
                                    body: entryFormData,
                                }
                            );
                            if (res.ok) {
                                let data = await res.json();
                                if (data.success) {
                                    let file = JSON.stringify(data.message);
                                    let blob = new Blob([file], {
                                        type: 'application/json',
                                    });
                                    let fileName = entry.name;
                                    let fileObj = new File([blob], fileName, {
                                        type: 'application/json',
                                    });
                                    files.push(fileObj);
                                    fileList.push(fileName);
                                } else {
                                    window.alert(
                                        `Impossible de récupérer le fichier ${entry.name}`
                                    );
                                    dropboxBtn.textContent =
                                        'Importer depuis Dropbox';
                                    dropboxBtn.disabled = false;
                                    return;
                                }
                            } else {
                                window.alert(
                                    `Erreur PHP pour le fichier ${entry.name}`
                                );
                                dropboxBtn.textContent =
                                    'Importer depuis Dropbox';
                                dropboxBtn.disabled = false;
                                return;
                            }
                        }
                    }
                    dropboxBtn.textContent = 'Importer depuis Dropbox';
                    dropboxBtn.disabled = false;
                    fileName.innerHTML = `${fileList.length} fichier(s) récupéré(s) :`;
                    const displaySpan = document.createElement('span');
                    displaySpan.textContent = 'Afficher';
                    displaySpan.classList.add('wishes-ui', 'display-span');
                    displaySpan.onclick = () => {
                        let fileNameList =
                            document.getElementById('filename-list');
                        if (!fileNameList) {
                            fileNameList = document.createElement('ul');
                            fileNameList.id = 'filename-list';
                            fileNameList.classList.add('filename-list');
                            for (let fileName of fileList) {
                                const item = document.createElement('li');
                                item.textContent = fileName;
                                fileNameList.appendChild(item);
                            }
                            fileName.after(fileNameList);
                            displaySpan.textContent = 'Masquer';
                        } else {
                            fileNameList.remove();
                            displaySpan.textContent = 'Afficher';
                        }
                    };
                    fileName.appendChild(displaySpan);
                    const actionChoiceDiv =
                        document.getElementById('action-choice');
                    actionChoiceDiv.style.display = 'block';
                    eraseBtn.style.display = 'inline';
                    if (servicesFile.length > 0) {
                        compileBtn.textContent = 'Mettre à jour';
                    }
                } else {
                    fileName.textContent = 'Aucun fichier trouvé';
                    dropboxBtn.textContent = 'Importer depuis Dropbox';
                    dropboxBtn.disabled = false;
                    return;
                }
            } else {
                if (data.status === 401) {
                    if (attempts < 4) {
                        dropboxToken = await getDropboxToken();
                        if (dropboxToken) {
                            getWishFiles();
                            return;
                        } else {
                            console.error(
                                'Could not refresh Dropbox token to check for files.'
                            );
                            return;
                        }
                    }
                } else {
                    console.error('Error listing Dropbox folder', data.message);
                    dropboxBtn.textContent = 'Importer depuis Dropbox';
                    dropboxBtn.disabled = false;
                    return;
                }
            }
        } else {
            console.error("Erreur lors de l'appel au script PHP");
            window.alert('Erreur PHP');
            return;
        }
    }

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
        return new Promise(async (resolve, reject) => {
            try {
                let cancels = 0;
                for (let i = 0; i < files.length; i++) {
                    const newJson = await readWishes(files[i]);
                    const prof = newJson.Name;
                    const cours = newJson.Cours;
                    const existingProf = servicesFile.find(
                        (s) => s.Name === prof
                    );
                    if (existingProf) {
                        const dialog = document.getElementById(
                            'existing-prof-dialog'
                        );
                        const thisDialog = dialog.cloneNode(true);
                        const profIdSpan = thisDialog.querySelector('#prof-id');
                        profIdSpan.textContent = prof;
                        const addBtn = thisDialog.querySelector('#add-btn');
                        const replaceBtn =
                            thisDialog.querySelector('#replace-btn');
                        const cancelBtn =
                            thisDialog.querySelector('#cancel-btn');
                        addBtn.onclick = () => {
                            cours.forEach((c) => {
                                existingProf.Cours.push(c);
                            });
                            existingProf.Cours.sort(sortByInt);
                            existingProf.Cours.sort(sortBySem);
                            existingProf.Cours.sort(sortByFil);
                            thisDialog.remove();
                            if (i === 0) {
                                resolve(true);
                            }
                        };
                        replaceBtn.onclick = () => {
                            const index = servicesFile.indexOf(existingProf);
                            servicesFile.splice(index, 1, newJson);
                            thisDialog.remove();
                            if (i === 0) {
                                resolve(true);
                            }
                        };
                        cancelBtn.onclick = () => {
                            cancels++;
                            thisDialog.remove();
                            if (cancels === files.length) {
                                resolve(false);
                            } else if (i === 0) {
                                resolve(true);
                            }
                        };
                        document.body.appendChild(thisDialog);
                        thisDialog.showModal();
                    } else {
                        servicesFile.push(newJson);
                        servicesFile.sort((a, b) => {
                            const intA = a.Name.split(' ')[1].toLowerCase();
                            const intB = b.Name.split(' ')[1].toLowerCase();
                            return intA.localeCompare(intB);
                        });
                        resolve(true);
                    }
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    compileBtn.addEventListener('click', async () => {
        ok = await compileWishes();
        if (ok) {
            compileBtn.style.backgroundColor = 'green';
            setTimeout(() => {
                compileBtn.removeAttribute('style');
                fileName.textContent = null;
                const actionChoiceDiv =
                    document.getElementById('action-choice');
                actionChoiceDiv.style.display = 'none';
                saveBtn.style.display = 'inline-block';
            }, 1000);
            compareData();
        } else if (!ok) {
            fileName.textContent = null;
        }
    });

    // Logic to save/update remote services file
    let saved = false;
    saveBtn.addEventListener('click', async () => {
        if (servicesFile.length === 0) {
            const eraseDialog = document.createElement('dialog');
            const div = document.createElement('div');
            div.innerHTML =
                'Voulez-vous vraiment écraser les données existantes ?<br>Cela supprimera toutes les données.';
            const div2 = document.createElement('div');
            div2.style.color = '#cc0000';
            div2.style.fontWeight = 'bold';
            div2.innerHTML = 'Cette opération est irréversible.';
            const yesBtn = document.createElement('button');
            yesBtn.classList.add('wishes-ui', 'reset-btn');
            yesBtn.textContent = 'Oui';
            const noBtn = document.createElement('button');
            noBtn.classList.add('wishes-ui');
            noBtn.textContent = 'Non';
            yesBtn.addEventListener('click', async () => {
                eraseDialog.remove();
                const btnText = saveChangesBtn.firstChild;
                const saveSpinner = document.getElementById('save-spinner');
                btnText.textContent = null;
                saveSpinner.style.display = 'inline-block';
                const success = await saveFile(servicesFile);
                if (success) {
                    saveSpinner.style.display = 'none';
                    btnText.textContent = '✔︎';
                    saveBtn.style.backgroundColor = 'green';
                } else {
                    saveSpinner.style.display = 'none';
                    btnText.textContent = '❌';
                    saveBtn.style.backgroundColor = '#cc0000';
                }
                setTimeout(() => {
                    saveBtn.removeAttribute('style');
                    btnText.textContent = 'Synchroniser';
                    saveBtn.style.display = 'none';
                }, 1000);
            });
            noBtn.addEventListener('click', () => {
                eraseDialog.remove();
            });
            eraseDialog.appendChild(div);
            eraseDialog.appendChild(div2);
            eraseDialog.appendChild(yesBtn);
            eraseDialog.appendChild(noBtn);
            document.body.appendChild(eraseDialog);
            eraseDialog.showModal();
        } else {
            const btnText = saveBtn.firstChild;
            const saveSpinner = document.getElementById('save-spinner');
            btnText.textContent = null;
            saveSpinner.style.display = 'inline-block';
            const success = await saveFile(servicesFile);
            if (success) {
                saveSpinner.style.display = 'none';
                btnText.textContent = '✔︎';
                saveBtn.style.backgroundColor = 'green';
            } else {
                saveSpinner.style.display = 'none';
                btnText.textContent = '❌';
                saveBtn.style.backgroundColor = '#cc0000';
            }
            setTimeout(() => {
                saveBtn.removeAttribute('style');
                btnText.textContent = 'Synchroniser';
                saveBtn.style.display = 'none';
            }, 1000);
        }
    });

    async function saveFile(file) {
        const fileString = JSON.stringify(file);
        const encoder = new TextEncoder();
        const utf8Array = encoder.encode(fileString);
        const finalFile = btoa(String.fromCharCode.apply(null, utf8Array));
        const url =
            'https://api.github.com/repos/fmoncomble/voeux/contents/services.json';
        const token = localStorage.getItem('github-admin-token');
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
                    return false;
                } else {
                    const errData = await saveRes.json();
                    window.alert(
                        'Vous ne disposez pas des autorisations nécessaires : ' +
                            errData.message
                    );
                    return false;
                }
            } else {
                const data = await saveRes.json();
                sha = data.content.sha;
                saved = true;
                return true;
            }
        } catch (error) {
            window.alert('Une erreur a été rencontrée : ' + error);
            console.error(error);
        }
    }

    // Function to display list of courses
    const courseListContainer = document.getElementById(
        'course-list-container'
    );
    const closeBtn = document.getElementById('close-course-list');
    closeBtn.addEventListener('click', () => {
        filièreSelect.value = 'LLCER';
        semestreSelect.value = 'S1';
        profInput.value = null;
        courseListContainer.style.display = 'none';
        courseListDiv.classList.remove('pb-list');
    });
    async function buildCourseList(filière, semestre, prof) {
        courseListDiv.classList.remove('pb-list');
        const remarksDiv = document.getElementById('remarks');
        remarksDiv.textContent = null;
        courseListContainer.style.display = 'flex';
        const serviceDiv = document.getElementById('service-div');
        if (serviceDiv) {
            serviceDiv.remove();
        }
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
        courses.sort(sortByInt);
        courses.sort(sortBySem);
        courses.sort(sortByFil);
        let logic;
        let refCourses;
        if (filière && semestre) {
            logic = 'course';
            dispoDiv.style.display = 'none';
            refCourses = courseFile.filter(
                (c) => c.filière === filière && c.semestre === semestre
            );
            if (refCourses.length === 0) {
                const newItem = courseItem.cloneNode(true);
                newItem.textContent = `Aucun enseignement trouvé pour ${filière} ${semestre}`;
                courseList.appendChild(newItem);
                newItem.style.display = 'block';
                dispoDiv.style.display = 'none';
            }
        } else if (prof) {
            logic = 'prof';
            refCourses = courses.filter((c) => c.teacher === prof);
            if (refCourses.length === 0) {
                const newItem = courseItem.cloneNode(true);
                newItem.textContent = `Aucun enseignement trouvé pour ${prof}`;
                courseList.appendChild(newItem);
                newItem.style.display = 'block';
                dispoDiv.style.display = 'none';
            }
        }

        const courseItems = new Set();
        let courseIndex = 1;
        for (let c of refCourses) {
            const courseId = c.id;
            const courseFromFile = courseFile.find((i) => i.id === courseId);
            let newItem;
            // let reqNb = Number(c.nbgrp);
            let reqNb = Number(courseFromFile.nbgrp);
            let tCourses;
            let courseNb;
            if (logic === 'course') {
                tCourses = courses.filter((i) => i.id === c.id);
                courseNb = tCourses.length;
            }
            if (logic === 'prof') {
                courseNb = refCourses.filter((i) => i.id === c.id).length;
            }
            if (!courseItems.has(courseId)) {
                courseItems.add(courseId);
                newItem = courseItem.cloneNode(true);
                newItem.id = `course-item-${courseId}`;
                courseIndex++;
                const courseListElements = Array.from(
                    courseList.querySelectorAll('li')
                );
                if (courseListElements) {
                    const thisFHeader = courseListElements.find(
                        (h) => h.textContent === c.filière.toUpperCase()
                    );
                    if (thisFHeader) {
                        const sList = thisFHeader.nextElementSibling;
                        if (sList) {
                            const sHeaders = Array.from(
                                sList.querySelectorAll('li')
                            );
                            if (sHeaders) {
                                const thisSHeader = sHeaders.find(
                                    (h) => h.textContent === c.semestre
                                );
                                if (thisSHeader) {
                                    const cList =
                                        thisSHeader.nextElementSibling;
                                    if (cList) {
                                        fillCourseInfo(cList, newItem);
                                    }
                                } else {
                                    const newSHeader =
                                        document.createElement('li');
                                    newSHeader.textContent = c.semestre;
                                    newSHeader.id = `${c.filière}-${c.semestre}-header`;
                                    newSHeader.classList.add(
                                        'course-list-header'
                                    );
                                    const cList = document.createElement('ul');
                                    cList.id = `${c.filière}-${c.semestre}-list`;
                                    fillCourseInfo(cList, newItem);
                                    sList.appendChild(newSHeader);
                                    sList.appendChild(cList);
                                }
                            }
                        }
                    } else {
                        const newFHeader = document.createElement('li');
                        newFHeader.textContent = c.filière.toUpperCase();
                        newFHeader.id = `${c.filière}-header`;
                        newFHeader.classList.add('course-list-header');
                        const sList = document.createElement('ul');
                        sList.id = `${c.filière}-list`;
                        const newSHeader = document.createElement('li');
                        newSHeader.id = `${c.filière}-${c.semestre}-header`;
                        newSHeader.textContent = c.semestre;
                        newSHeader.classList.add('course-list-header');
                        const newCList = document.createElement('ul');
                        newCList.id = `${c.filière}-${c.semestre}-list`;
                        fillCourseInfo(newCList, newItem);
                        sList.appendChild(newSHeader);
                        sList.appendChild(newCList);
                        courseList.appendChild(newFHeader);
                        courseList.appendChild(sList);
                    }
                }
                function fillCourseInfo(parent, newItem) {
                    const courseName =
                        newItem.querySelector('span#course-name');
                    const courseTeachersSpan = newItem.querySelector(
                        'span#course-teachers'
                    );
                    courseName.textContent = `${c.intitulé} (${c.volume}h`;
                    if (c.format !== 'TD') {
                        courseName.textContent += ` ${c.format} = ${c.eqtd}h éq.`;
                    }
                    courseName.textContent += ' TD)';
                    if (tCourses && tCourses.length > 0) {
                        let courseTeachers = [];
                        tCourses.forEach((tC) => {
                            const teacherNameSegments = tC.teacher.split(' ');
                            let teacherFirstName = teacherNameSegments[0];
                            if (
                                teacherFirstName !== 'ATER' &&
                                teacherFirstName !== 'LECT'
                            ) {
                                if (teacherFirstName.includes('-')) {
                                    let firstNameSegments =
                                        teacherFirstName.split('-');
                                    teacherFirstName = '';
                                    firstNameSegments = firstNameSegments.map(
                                        (f) => `${f.split('')[0]}.`
                                    );
                                    teacherFirstName =
                                        firstNameSegments.join('-');
                                } else {
                                    teacherFirstName =
                                        teacherFirstName.split('')[0] + '.';
                                }
                            }
                            const teacherSurname = teacherNameSegments
                                .slice(1)
                                .join(' ');
                            const fullName = `${teacherFirstName} ${teacherSurname}`;
                            const existingTeacher = courseTeachers.find(
                                (cT) => cT.name === fullName
                            );
                            if (!existingTeacher) {
                                courseTeachers.push({
                                    name: fullName,
                                    count: 1,
                                });
                            } else {
                                existingTeacher.count++;
                            }
                        });
                        courseTeachersSpan.textContent = courseTeachers
                            .map((t) => `${t.name} (${t.count})`)
                            .join(', ');
                    } else {
                        newItem.querySelector(
                            'span#course-teachers-span'
                        ).style.display = 'none';
                    }
                    const courseNumberSpan =
                        newItem.querySelector('span#course-number');
                    courseNumberSpan.textContent = `${courseNb} / ${reqNb}`;
                    if (logic === 'course') {
                        if (courseNb === 0 || courseNb > reqNb) {
                            courseNumberSpan.style.color = '#cc0000';
                            if (courseNb > reqNb) {
                                courseNumberSpan.style.backgroundColor =
                                    'yellow';
                            }
                        } else if (courseNb < reqNb) {
                            courseNumberSpan.style.color = 'orange';
                        } else if (courseNb === reqNb) {
                            courseNumberSpan.style.color = 'green';
                        }
                    }
                    if (logic === 'prof') {
                        const courseTeachersSpan = newItem.querySelector(
                            'span#course-teachers-span'
                        );
                        courseTeachersSpan.remove();
                    }
                    newItem.style.display = 'block';
                    parent.appendChild(newItem);
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
            serviceDiv.id = 'service-div';
            serviceDiv.style.marginTop = '10px';
            serviceDiv.style.fontWeight = 'bold';
            serviceDiv.textContent = `Total : ${totalService}h éq. TD`;
            if (baseService !== Infinity) {
                serviceDiv.textContent += ` / ${baseService}`;
                if (totalService > baseService) {
                    let nbHc = totalService - baseService;
                    let result = nbHc.toFixed(2);
                    nbHc = Number(parseFloat(result));
                    serviceDiv.textContent += ` (${nbHc} HC)`;
                }
                if (totalService === baseService) {
                    serviceDiv.style.color = 'green';
                } else if (
                    totalService > 2 * baseService ||
                    totalService < baseService
                ) {
                    serviceDiv.style.color = '#cc0000';
                } else {
                    serviceDiv.style.color = 'green';
                }
            }
            courseListDiv.after(serviceDiv);
            const dispoTable = dispoDiv.querySelector('table');
            const rows = dispoTable.getElementsByTagName('tr');
            const colHeaders = rows[0].getElementsByTagName('th');
            const profDispos = profFromFile.Dispos;
            if (profDispos && profDispos.length > 0) {
                dispoDiv.querySelector('div').innerHTML =
                    '<b>Indisponibilités :</b>';
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
                    dCell.style.backgroundColor = '#ffe6e6';
                    dCell.textContent = '❌';
                }
                dispoDiv.style.display = 'flex';
            } else {
                dispoDiv.querySelector('div').textContent =
                    'Aucune indisponibilité';
                const cells = dispoTable.getElementsByTagName('td');
                for (let c of cells) {
                    c.textContent = null;
                    c.removeAttribute('style');
                }
                dispoDiv.style.display = 'flex';
            }
            const profRemarks = profFromFile.Remarques;
            if (profRemarks && profRemarks.length > 0) {
                remarksDiv.innerHTML = `<b>Remarques :</b><br />${profRemarks}`;
                remarksDiv.style.display = 'flex';
            } else {
                remarksDiv.textContent = null;
                remarksDiv.style.display = 'none';
            }
        }
    }

    // Function to display problem courses
    function showPbCourses() {
        courseListContainer.style.display = 'flex';
        const serviceDiv = document.getElementById('service-div');
        if (serviceDiv) {
            serviceDiv.remove();
        }
        dispoDiv.style.display = 'none';
        const remarksDiv = document.getElementById('remarks');
        remarksDiv.textContent = null;
        remarksDiv.style.display = 'none';
        const courseItemArray = Array.from(courseList.children);
        for (let i = 1; i < courseItemArray.length; i++) {
            courseItemArray[i].textContent;
            courseItemArray[i].remove();
        }
        const courseItem = document.getElementById('course-item');
        let taughtCourses = [];
        for (let s of servicesFile) {
            let indivCourses = s.Cours;
            for (let c of indivCourses) {
                taughtCourses.push(c);
            }
        }
        for (let c of courseFile) {
            const courses = taughtCourses.filter((s) => s.id === c.id);
            if (courses.length !== c.nbgrp) {
                newPbItem = courseItem.cloneNode(true);
                const courseListElements = Array.from(
                    courseList.querySelectorAll('li')
                );
                if (courseListElements) {
                    const thisFHeader = courseListElements.find(
                        (h) => h.textContent === c.filière.toUpperCase()
                    );
                    if (thisFHeader) {
                        const sList = thisFHeader.nextElementSibling;
                        if (sList) {
                            const sHeaders = Array.from(
                                sList.querySelectorAll('li')
                            );
                            if (sHeaders) {
                                const thisSHeader = sHeaders.find(
                                    (h) => h.textContent === c.semestre
                                );
                                if (thisSHeader) {
                                    const cList =
                                        thisSHeader.nextElementSibling;
                                    if (cList) {
                                        fillCourseInfo(cList, newPbItem);
                                    }
                                } else {
                                    const newSHeader =
                                        document.createElement('li');
                                    newSHeader.textContent = c.semestre;
                                    newSHeader.id = `${c.filière}-${c.semestre}-header`;
                                    newSHeader.classList.add(
                                        'course-list-header'
                                    );
                                    const cList = document.createElement('ul');
                                    cList.id = `${c.filière}-${c.semestre}-list`;
                                    fillCourseInfo(cList, newPbItem);
                                    sList.appendChild(newSHeader);
                                    sList.appendChild(cList);
                                }
                            }
                        }
                    } else {
                        const newFHeader = document.createElement('li');
                        newFHeader.textContent = c.filière.toUpperCase();
                        newFHeader.id = `${c.filière}-header`;
                        newFHeader.classList.add('course-list-header');
                        const sList = document.createElement('ul');
                        sList.id = `${c.filière}-list`;
                        const newSHeader = document.createElement('li');
                        newSHeader.id = `${c.filière}-${c.semestre}-header`;
                        newSHeader.textContent = c.semestre;
                        newSHeader.classList.add('course-list-header');
                        const newCList = document.createElement('ul');
                        newCList.id = `${c.filière}-${c.semestre}-list`;
                        fillCourseInfo(newCList, newPbItem);
                        sList.appendChild(newSHeader);
                        sList.appendChild(newCList);
                        courseList.appendChild(newFHeader);
                        courseList.appendChild(sList);
                    }
                }
                function fillCourseInfo(parent, newPbItem) {
                    const pbCourseName =
                        newPbItem.querySelector('#course-name');
                    pbCourseName.textContent = `${c.intitulé} (${c.volume}h`;
                    if (c.format !== 'TD') {
                        pbCourseName.textContent += ` ${c.format} = ${c.eqtd}h éq.`;
                    }
                    pbCourseName.textContent += ' TD)';
                    const pbCourseTeachersSpan = newPbItem.querySelector(
                        '#course-teachers-span'
                    );
                    if (courses.length === 0) {
                        pbCourseTeachersSpan.style.display = 'none';
                    } else {
                        let courseTeachers = [];
                        const pbCourseTeachers =
                            newPbItem.querySelector('#course-teachers');
                        for (let s of servicesFile) {
                            let sCours = s.Cours.filter((i) => i.id === c.id);
                            if (sCours.length > 0) {
                                sCours.forEach(() => {
                                    const teacherNameSegments =
                                        s.Name.split(' ');
                                    let teacherFirstName =
                                        teacherNameSegments[0];
                                    if (
                                        teacherFirstName !== 'ATER' &&
                                        teacherFirstName !== 'LECT'
                                    ) {
                                        if (teacherFirstName.includes('-')) {
                                            let firstNameSegments =
                                                teacherFirstName.split('-');
                                            teacherFirstName = '';
                                            firstNameSegments =
                                                firstNameSegments.map(
                                                    (f) => `${f.split('')[0]}.`
                                                );
                                            teacherFirstName =
                                                firstNameSegments.join('-');
                                        } else {
                                            teacherFirstName =
                                                teacherFirstName.split('')[0] +
                                                '.';
                                        }
                                    }
                                    const teacherSurname = teacherNameSegments
                                        .slice(1)
                                        .join(' ');
                                    const fullName = `${teacherFirstName} ${teacherSurname}`;
                                    const existingTeacher = courseTeachers.find(
                                        (cT) => cT.name === fullName
                                    );
                                    if (!existingTeacher) {
                                        courseTeachers.push({
                                            name: fullName,
                                            count: 1,
                                        });
                                    } else {
                                        existingTeacher.count++;
                                    }
                                });
                            }
                        }
                        pbCourseTeachers.textContent = courseTeachers
                            .map((t) => `${t.name} (${t.count})`)
                            .join(', ');
                    }
                    const pbCourseNumber =
                        newPbItem.querySelector('#course-number');
                    pbCourseNumber.textContent = `${courses.length}/${c.nbgrp}`;
                    if (courses.length === 0 || courses.length > c.nbgrp) {
                        pbCourseNumber.style.color = '#cc0000';
                        if (courses.length > c.nbgrp) {
                            pbCourseNumber.style.backgroundColor = 'yellow';
                        }
                    } else if (courses.length < c.nbgrp) {
                        pbCourseNumber.style.color = 'orange';
                    }
                    newPbItem.style.display = 'block';
                    parent.appendChild(newPbItem);
                }
            }
        }
        courseListDiv.classList.add('pb-list');
    }

    const pbBtn = document.getElementById('pb-btn');
    pbBtn.addEventListener('click', () => {
        showPbCourses();
    });

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
        semestreSelect.value = 'S1';
    });

    const checkCourseBtn = document.getElementById('check-course-btn');
    checkCourseBtn.addEventListener('click', async () => {
        const filière = filièreSelect.value;
        const semestre = semestreSelect.value;
        profInput.value = null;
        buildCourseList(filière, semestre, null);
    });

    // Handle teacher selection
    const profInput = document.getElementById('prof-input');
    const profList = document.getElementById('prof-list');
    const checkProfBtn = document.getElementById('check-prof-btn');
    checkProfBtn.addEventListener('click', () => {
        if (profInput.value === '') {
            profInput.focus();
            return;
        }
        filièreSelect.value = 'LLCER';
        semestreSelect.value = 'S1';
        const prof = profInput.value;
        buildCourseList(null, null, prof);
    });
    profInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkProfBtn.click();
        }
    });
    profInput.addEventListener('click', () => {
        profInput.value = null;
    });
    async function getProfFile() {
        try {
            const url =
                'https://api.github.com/repos/fmoncomble/voeux/contents/profs.json?ref=main';
            const ghToken = localStorage.getItem('github-admin-token');
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
            const ghToken = localStorage.getItem('github-admin-token');
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

    let profBackup = null;
    const profInput2 = document.getElementById('prof-input-2');
    profInput2.addEventListener('click', () => {
        profInput2.value = null;
    });
    const goProfBtn = document.getElementById('go-prof-btn');
    profInput2.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            goProfBtn.click();
        }
    });
    goProfBtn.addEventListener('click', () => {
        if (profInput2.value === '') {
            profInput2.focus();
            return;
        }
        const existingFile = servicesFile.find(
            (p) => p.Name === profInput2.value
        );
        if (existingFile) {
            profBackup = JSON.parse(JSON.stringify(existingFile));
        }
        const ensModDiv = document.getElementById('ens-modify');
        const ensModSpan = document.getElementById('ens-modify-name');
        ensModSpan.textContent = profInput2.value;
        ensModDiv.style.display = 'block';
        const servModDiv = document.getElementById('service-modify');
        servModDiv.style.display = 'block';
        profInput.value = profInput2.value;
        checkProfBtn.click();
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
    filièreSelect3.addEventListener('change', () => {
        buildCourseDeleteSelect();
    });
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
        const existingCourses = servicesFile
            .flatMap((t) => t.Cours)
            .filter((c) => c.id === courseToAdd.id);
        if (existingCourses.length >= courseToAdd.nbgrp) {
            let override = window.confirm(
                `Tous les groupes de ce cours sont déjà pourvus.\n\nContinuer ?`
            );
            if (!override) {
                return;
            }
        }
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
        courseAddSpan.textContent += ` a été ajouté au service de ${prof}. Total : ${totalService}h éq. TD`;
        if (baseService !== Infinity) {
            courseAddSpan.textContent += ` sur ${baseService}`;
        }
        courseAddDiv.style.display = 'block';
        checkProfBtn.click();
        setTimeout(() => {
            courseAddDiv.style.display = 'none';
        }, 1000);
        customVolInput.value = '';
        compareData();
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
        courseDeleteSpan.textContent = `${filière.toUpperCase()} ${semestre} ${courseName} a été supprimé du service de ${prof}. Total : ${totalService}h éq. TD`;
        if (baseService !== Infinity) {
            courseDeleteSpan.textContent += ` sur ${baseService}`;
        }
        courseDeleteDiv.style.display = 'block';
        checkProfBtn.click();
        setTimeout(() => {
            courseDeleteDiv.style.display = 'none';
        }, 1000);
        compareData();
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
            } else if (profStatus === 'PRAG/PRCE') {
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
        let result = totalService.toFixed(2);
        totalService = Number(parseFloat(result));
        return [baseService, totalService];
    }

    const saveChangesBtn = document.getElementById('save-changes-btn');
    saveChangesBtn.addEventListener('click', async () => {
        const btnText = saveChangesBtn.firstChild;
        const saveChgSpinner = document.getElementById('save-chg-spinner');
        btnText.textContent = null;
        saveChgSpinner.style.display = 'inline-block';
        const success = await saveFile(servicesFile);
        if (success) {
            profBackup = null;
            saveChgSpinner.style.display = 'none';
            btnText.textContent = '✔︎';
            saveChangesBtn.style.backgroundColor = 'green';
        } else {
            saveChgSpinner.style.display = 'none';
            btnText.textContent = '❌';
            saveChangesBtn.style.backgroundColor = '#cc0000';
        }
        setTimeout(() => {
            saveChangesBtn.removeAttribute('style');
            btnText.textContent = 'Synchroniser';
            const servModDiv = document.getElementById('service-modify');
            servModDiv.style.display = 'none';
            profInput2.value = null;
        }, 1000);
    });

    const cancelChangesBtn = document.getElementById('cancel-changes-btn');
    cancelChangesBtn.addEventListener('click', () => {
        const profIndex = servicesFile.findIndex(
            (p) => p.Name === profInput2.value
        );
        if (profBackup) {
            servicesFile.splice(profIndex, 1, profBackup);
        } else {
            servicesFile.splice(profIndex, 1);
        }
        profBackup = null;
        const servModDiv = document.getElementById('service-modify');
        servModDiv.style.display = 'none';
        profInput2.value = null;
        closeBtn.click();
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

    // Function to flatten servicesFile and group by teacherName
    function flattenJson() {
        return new Promise((resolve, reject) => {
            try {
                const groupedByTeacher = {};
                for (let s of servicesFile) {
                    const teacherName = s.Name;
                    const teacherCourses = s.Cours;
                    teacherCourses.sort(sortByInt);
                    teacherCourses.sort(sortBySem);
                    teacherCourses.sort(sortByFil);
                    if (!groupedByTeacher[teacherName]) {
                        groupedByTeacher[teacherName] = [];
                    }
                    for (let c of teacherCourses) {
                        const course = {
                            Enseignant: teacherName,
                            Filière: c.filière,
                            Semestre: c.semestre,
                            Format: c.format,
                            Intitulé: c.intitulé,
                            Volume: Number(c.volume),
                            EqTD: Number(c.eqtd),
                        };
                        groupedByTeacher[teacherName].push(course);
                    }
                }
                resolve(groupedByTeacher);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Function to generate and download XLSX file from grouped data
    async function makeXlsx() {
        const groupedData = await flattenJson();
        const workbook = new ExcelJS.Workbook();

        // Iterate over each teacher and create a worksheet
        for (const teacherName in groupedData) {
            if (groupedData.hasOwnProperty(teacherName)) {
                const teacherCourses = groupedData[teacherName];
                const worksheet = workbook.addWorksheet(teacherName);

                worksheet.columns = [
                    {
                        header: 'Enseignant',
                        key: 'Enseignant',
                        width: teacherName.length + 1,
                    },
                    { header: 'Filière', key: 'Filière' },
                    { header: 'Semestre', key: 'Semestre' },
                    { header: 'Format', key: 'Format' },
                    { header: 'Intitulé', key: 'Intitulé', width: 30 },
                    { header: 'Volume', key: 'Volume' },
                    { header: 'EqTD', key: 'EqTD' },
                ];

                const rows = teacherCourses.map((c) => [
                    c.Enseignant,
                    c.Filière,
                    c.Semestre,
                    c.Format,
                    c.Intitulé,
                    Number(c.Volume),
                    Number(c.EqTD),
                ]);

                worksheet.addTable({
                    name: `Table_${teacherName
                        .replaceAll(/\s+/g, '_')
                        .replaceAll('-', '_')}`,
                    ref: 'A1',
                    style: {
                        theme: 'TableStyleMedium9',
                        showRowStripes: true,
                    },
                    columns: worksheet.columns.map((col) => ({
                        name: col.header,
                        filterButton: true,
                    })),
                    rows: rows,
                });

                // Calculate and add totals
                let volSum = 0;
                let eqtdSum = 0;
                teacherCourses.forEach((course) => {
                    volSum += course.Volume;
                    eqtdSum += course.EqTD;
                });
                const result = eqtdSum.toFixed(2);
                eqtdSum = Number(parseFloat(result));

                worksheet.addRow([]);
                worksheet.addRow(['', '', '', '', 'Total', volSum, eqtdSum]);

                // Add totals by format
                const formatSums = {};
                teacherCourses.forEach((course) => {
                    if (!formatSums[course.Format]) {
                        formatSums[course.Format] = 0;
                    }
                    formatSums[course.Format] += course.Volume;
                });

                for (let format in formatSums) {
                    if (formatSums.hasOwnProperty(format)) {
                        worksheet.addRow([
                            '',
                            '',
                            '',
                            '',
                            `Total ${format}`,
                            formatSums[format],
                        ]);
                    }
                }
            }
        }

        // Write the workbook to a file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const date = new Date().toISOString().split('T')[0];
        link.download = `Services_${date}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportBtn = document.getElementById('export-btn');
    exportBtn.onclick = async () => {
        await makeXlsx();
    };

    // Danger zone
    const dangerZoneHeader = document.getElementById('danger-zone-header');
    const dangerZone = document.getElementById('danger-zone');
    dangerZoneHeader.addEventListener('click', () => {
        const dangerBtn = dangerZone.querySelector('button');
        if (dangerBtn.style.display === 'none') {
            dangerBtn.style.display = 'inline-block';
        } else {
            dangerBtn.style.display = 'none';
        }
    });
    const eraseServicesBtn = document.getElementById('erase-services-btn');
    eraseServicesBtn.addEventListener('click', () => {
        const dialog = document.createElement('dialog');
        const div = document.createElement('div');
        div.textContent = `Voulez-vous vraiment écraser le fichier de services ?`;
        const div2 = document.createElement('div');
        div2.style.color = '#cc0000';
        div2.style.fontWeight = 'bold';
        div2.innerHTML = 'Cette opération est irréversible.';
        const yesBtn = document.createElement('button');
        yesBtn.textContent = 'Oui';
        yesBtn.classList.add('wishes-ui', 'danger-btn');
        yesBtn.addEventListener('click', async () => {
            const spinner = document.createElement('span');
            spinner.classList.add('spinner');
            spinner.style.border = 'solid 2px #ffcc00';
            spinner.style.borderLeft = 'solid 2px #cc0000';
            yesBtn.appendChild(spinner);
            const btnText = yesBtn.firstChild;
            btnText.textContent = null;
            spinner.style.display = 'inline-block';
            servicesFile = [];
            const success = await saveFile(servicesFile);
            if (success) {
                spinner.style.display = 'none';
                btnText.textContent = '✔︎';
            } else {
                spinner.style.display = 'none';
                btnText.textContent = '❌';
                yesBtn.style.backgroundColor = '#cc0000';
            }
            setTimeout(() => {
                yesBtn.removeAttribute('style');
                btnText.textContent = 'Oui';
                dialog.remove();
                const dangerBtn = dangerZone.querySelector('button');
                dangerBtn.style.display = 'none';
            }, 1000);
        });
        const noBtn = document.createElement('button');
        noBtn.textContent = 'Non';
        noBtn.classList.add('wishes-ui');
        noBtn.addEventListener('click', () => {
            dialog.remove();
        });
        dialog.appendChild(div);
        dialog.appendChild(div2);
        dialog.appendChild(yesBtn);
        dialog.appendChild(noBtn);
        document.body.appendChild(dialog);
        dialog.showModal();
    });

    // Alert before closing window
    function compareData() {
        if (
            saved ||
            JSON.stringify(remoteFile) == JSON.stringify(servicesFile)
        ) {
            window.removeEventListener('beforeunload', warnClose);
        } else {
            window.addEventListener('beforeunload', warnClose);
        }
    }
    function warnClose(e) {
        e.preventDefault();
    }
});
