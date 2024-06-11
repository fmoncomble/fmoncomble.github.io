document.addEventListener('DOMContentLoaded', async () => {
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

    // Get profs and cours files
    async function getFile(url) {
        try {
            const res = await fetch(url);
            if (res && res.ok) {
                const data = await res.json();
                return data;
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
    console.log('Profs: ', teacherData);
    const courseData = await getFile(courseDBUrl);
    console.log('Cours: ', courseData);

    function buildTeacherList() {
        const teacherList = document.getElementById('teacher-list');
        for (let t of teacherData) {
            let tName = t.name;
            const option = document.createElement('option');
            option.value = tName;
            teacherList.appendChild(option);
        }
    }

    buildTeacherList();

    let tName;
    let tService;
    let filière = 'LLCER';
    let semestre = 'S1';
    buildCourseList();

    goBtn.onclick = () => {
        if (!teacherInput.value) {
            window.alert('Entrez votre nom');
            teacherInput.focus();
            return;
        }
        tName = teacherInput.value;
        const tStatus = teacherData.find((t) => t.name === tName).status;
        if (tStatus) {
            teacherStatus.textContent = `Statut : ${tStatus}`;
        }
        const customService = teacherData.find((t) => t.name === tName).service;
        if (customService) {
            tService = customService;
        } else {
            if (tStatus === 'MCF' || tStatus === 'PR') {
                tService = 192;
            } else if (tStatus === 'PRAG' || tStatus === 'PRCE') {
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
            teacherService.textContent = `Service statutaire : ${tService} heures éq. TD`;
        }
        courseChoiceDiv.style.display = 'block';
    };

    // Limit available semester options according to filière
    filièreInput.addEventListener('change', () => {
        filière = filièreInput.value;
        console.log('Filière input changed');
        const options = Array.from(filièreInput.querySelectorAll('option'));
        const optionLevel = options.find((o) => o.value === filièreInput.value)
            .dataset.level;
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
        } else {
            semestreInput.querySelectorAll('option').forEach((o) => {
                o.disabled = false;
            });
        }
        buildCourseList();
    });

    semestreInput.addEventListener('change', () => {
        semestre = semestreInput.value;
        buildCourseList();
    });

    function buildCourseList() {
        const courseOptions = Array.from(
            courseInput.querySelectorAll('option')
        );
        for (co of courseOptions) {
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
        courseInfo.textContent = `${filière} — ${semestre} — ${cName} : ${course.volume}h = ${course.eqtd}hTD`;
        courseInfo.style.display = 'inline';
        saveBtn.style.display = 'inline';
        saveBtn.onclick = () => saveCourse(course);
    });

    let jsonFile;
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
        const addedCourse = document.createElement('span');
        const deleteBtn = document.createElement('span');
        addedCourse.textContent = `${course.filière} — ${course.semestre} — ${course.intitulé} : ${course.volume} = ${course.eqtd}hTD`;
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
        sendBtn.style.display = 'block';
        resetForm();
        i++;
    }

    function updateVol() {
        volTotal = 0;
        for (let c of jsonFile.Cours) {
            const cVol = Number(c.eqtd);
            volTotal += cVol;
        }
        hTotal.textContent = volTotal;
        if (volTotal > tService) {
            hTotal.style.fontWeight = 'bold';
            hTotal.style.color = 'orange';
            volHc = volTotal - Number(tService);
            hc.textContent = `, ${volHc} HC`;
        }
        if (volHc > tService * 2) {
            hc.style.fontWeight = 'bold';
            hc.style.color = 'red';
            hTotal.style.color = 'red';
        }
    }

    function deleteEntry(course, entry) {
        const c = jsonFile.Cours.indexOf(course);
        const deletedCourse = jsonFile.Cours.splice(c, 1);
        updateVol();
        entry.remove();
    }

    function duplicateEntry(course, entry, addedCourses) {
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
        saveBtn.removeAttribute('style');
        saveBtn.style.display = 'none';
    }

    sendBtn.onclick = () => {
        const myBlob = new Blob([JSON.stringify(jsonFile)], {
            type: 'text/plain',
        });
        const url = window.URL.createObjectURL(myBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Vœux ${tName}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    };
});
