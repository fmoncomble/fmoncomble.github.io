document.addEventListener('DOMContentLoaded', () => {
    const titleInput = document.getElementById('title');
    const mediaInput = document.getElementById('media');
    const paperInput = document.getElementById('paper');
    const dateInput = document.getElementById('date');
    const urlInput = document.getElementById('url');
    const disciplineInput = document.getElementById('discipline');
    const areaInput = document.getElementById('area');
    const tagInput = document.getElementById('tags');
    const tagList = document.getElementById('taglist');
    const tagSpan = document.getElementById('tag-span');
    const intNameInput = document.getElementById('name');
    const intStatusInput = document.getElementById('status');
    const instInput = document.getElementById('institution');
    const labInput = document.getElementById('lab');
    const emailInput = document.getElementById('email');
    const consentCheck = document.getElementById('consent-check');
    const captchaQtn = document.getElementById('captcha-qtn');
    const captchaInput = document.getElementById('captcha');
    const submitBtn = document.querySelector('button#submit-btn');
    const spinner = document.getElementById('spinner');
    const checkmark = document.getElementById('checkmark');

    submitBtn.disabled = true;

    // Create "captcha"
    function getRandomNb() {
        return Math.floor(Math.random() * 10);
    }
    const nb1 = getRandomNb();
    const nb2 = getRandomNb();
    captchaQtn.textContent = `${nb1} + ${nb2} = `;
    function checkCaptcha() {
        const captchaRight = nb1 + nb2;
        const captchaAnswer = Number(captchaInput.value);
        if (captchaAnswer === captchaRight) {
            captchaInput.backgroundColor = '#ebfaeb';
            return true;
        } else {
            captchaInput.backgroundColor = '#ffe6e6';
            return false;
        }
    }

    captchaInput.addEventListener('input', () => {
        const captcha = checkCaptcha();
        if (captcha && consentCheck.checked) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    });

    consentCheck.addEventListener('change', () => {
        const captcha = checkCaptcha();
        if (captcha && consentCheck.checked) {
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
        }
    });

    // Retrieve list of existing tags for input suggestions
    createTagList();
    tagInput.setAttribute('list', 'taglist');
    async function createTagList() {
        const tags = [];
        const url =
            'https://blogs.univ-tlse2.fr/saes/wp-json/wp/v2/tags?per_page=100&page=';
        let i = 1;
        while (url) {
            try {
                const pageUrl = url + i;
                const response = await fetch(pageUrl);
                if (response && response.ok) {
                    const data = await response.json();
                    if (data.length > 0) {
                        tags.push(...data);
                        i++;
                    } else {
                        break;
                    }
                } else {
                    window.alert(
                        'Échec de la création de la liste de mots-clefs. Cliquez sur "OK" pour recharger la page.'
                    );
                    location.reload();
                }
            } catch (error) {
                window.alert(
                    'Échec de la création de la liste de mots-clefs. Cliquez sur "OK" pour recharger la page.'
                );
                location.reload();
            }
        }
        for (tag of tags) {
            const opt = document.createElement('option');
            opt.value = tag.name;
            tagList.appendChild(opt);
        }
    }
    let tags = [];
    let t = 1;
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const tagName = tagInput.value.replaceAll(/<[^>]*>/gu, '').trim();
            tags.push(tagName);
            const tagLabel = document.createElement('span');
            tagLabel.id = `tag${t}`;
            tagLabel.classList.add('tag-label');
            tagLabel.textContent = tagInput.value.trim();
            const tagDelete = document.createElement('span');
            tagDelete.textContent = '❌';
            tagDelete.style.cursor = 'pointer';
            tagDelete.style.marginLeft = '0.5em';
            tagDelete.onclick = () => {
                tags = tags.filter((tag) => tag !== tagName);
                tagLabel.remove();
            };
            tagLabel.appendChild(tagDelete);
            tagSpan.appendChild(tagLabel);
            t++;
            tagInput.value = '';
        }
    });

    const reqInputs = Array.from(
        document.getElementsByClassName('required-input')
    );
    reqInputs.forEach((i) => {
        i.addEventListener('input', () => {
            i.removeAttribute('style');
        });
    });

    submitBtn.addEventListener('click', buildPost);

    // Build draft post contents
    async function buildPost() {
        const title = titleInput.value.replaceAll(/<[^>]*>/gu, '');
        const media = mediaInput.value.replaceAll(/<[^>]*>/gu, '');
        const paper = paperInput.value.replaceAll(/<[^>]*>/gu, '');
        const date = dateInput.value.replaceAll(/<[^>]*>/gu, '');
        let url = urlInput.value;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }
        const categories = [];
        categories.push(media);
        for (option of disciplineInput.options) {
            if (option.selected) {
                categories.push(option.value);
            }
        }
        for (option of areaInput.options) {
            if (option.selected) {
                categories.push(option.value);
            }
        }
        const intName = intNameInput.value.replaceAll(/<[^>]*>/gu, '');
        const intStatus = intStatusInput.value.replaceAll(/<[^>]*>/gu, '');
        const inst = instInput.value.replaceAll(/<[^>]*>/gu, '');
        const lab = labInput.value.replaceAll(/<[^>]*>/gu, '');
        const email = emailInput.value.replaceAll(/<[^>]*>/gu, '');

        // Check if all required inputs are filled in & display alert if not
        const missingValue = reqInputs.find((v) => !v.value);
        if (missingValue) {
            const missing = [];
            for (i of reqInputs) {
                if (!i.value) {
                    missing.push(i.name);
                    i.style.outline = 'solid 2px red';
                }
            }
            const missingString = missing.join(', ');
            missingValue.focus();
            window.alert(
                'Saisissez les informations manquantes: ' + missingString
            );
            spinner.style.display = 'none';
            return;
        }

        const dateArray = date.split('-');
        const year = dateArray[0];
        const month = dateArray[1];
        const day = dateArray[2];
        const postDate = `${day}/${month}/${year}`;
        let content = `<!-- wp:more --><!-- /wp:more -->
<b>Média :</b> ${media}<br>
<b>Émission ou journal :</b> ${paper}<br>
<b>Date :</b> ${postDate}<br>
<b>URL :</b> <a href="${url}" target="_blank">${url}</a><br><br>
<b>Intervenant.e :</b><br>
${intName}<br>
${intStatus}<br>
${inst}<br>
${lab}<br>
Courriel : <a href="mailto:${email}">${email}</a>`;

        // Build post preview
        const confirmDialog = document.getElementById('confirm-dialog');
        const subContent = document.getElementById('submission-content');
        subContent.innerHTML = `<b>${title}</b><br><br>` + content;
        const subCats = document.getElementById('submission-cats');
        if (categories.length > 0) {
            subCats.innerHTML = `<b>Catégorie(s) :</b> ${categories.join(
                ', '
            )}`;
        }
        const subTags = document.getElementById('submission-tags');
        if (tags.length > 0) {
            subTags.innerHTML = `<b>Mot(s)-clef(s) :</b> ${tags.join(', ')}`;
        }
        const yesBtn = document.getElementById('confirm-btn');
        const noBtn = document.getElementById('cancel-btn');
        yesBtn.onclick = async () => {
            const confirmMsg = document.getElementById('confirm-message');
            const dialogBtns = document.getElementById('dialog-btns');
            const spinnerDiv = document.getElementById('spinner-div');
            confirmMsg.style.display = 'none';
            dialogBtns.style.display = 'none';
            spinnerDiv.style.display = 'block';
            checkmark.style.display = 'none';
            spinner.style.display = 'inline-block';
            const tagIDs = await checkTag(tags);
            const cats = await retrieveCategories(categories);
            const id = await submitPost(title, content, cats, tagIDs);
            setTimeout(() => {
                confirmDialog.close();
                confirmMsg.style.display = 'block';
                dialogBtns.style.display = 'block';
                spinnerDiv.style.display = 'none';
                checkmark.style.display = 'none';
                sendMail(id);
            }, 1500);
        };
        noBtn.onclick = () => {
            confirmDialog.close();
            spinner.style.display = 'none';
            return;
        };
        confirmDialog.showModal();
    }

    // Check if user-provided tags exist and retrieve tag IDs
    async function checkTag(tags) {
        const tagIDs = [];
        for (tag of tags) {
            const response = await fetch(
                `https://blogs.univ-tlse2.fr/saes/wp-json/wp/v2/tags?search=${tag}`
            );
            if (response && response.ok) {
                const data = await response.json();
                if (data.length > 0) {
                    const tagID = data[0].id;
                    tagIDs.push(tagID);
                } else {
                    const tagID = await createTag(tag);
                    tagIDs.push(tagID);
                }
            }
        }
        return tagIDs;
    }

    // Create new tag
    async function createTag(tag) {
        const url = 'https://blogs.univ-tlse2.fr/saes/wp-json/wp/v2/tags';
        const cred = 'dGVzdDp3TldLaXJybkZob1VsSnBkU05aWFVmRWo=';
        // const token =
        //     '';
        const headers = new Headers();
        // headers.append('Authorization', 'Bearer ' + token);
        headers.append('Authorization', 'Basic ' + cred);
        headers.append('Content-type', 'application/json');
        const tagData = {
            name: tag,
        };
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(tagData),
        });
        if (response && response.ok) {
            const data = await response.json();
            if (data) {
                return data.id;
            }
        } else {
            console.error(response.message);
            window.alert(`Could not create tag "${tag}": ${response.message}`);
            return;
        }
    }

    // Retrive category IDs
    async function retrieveCategories(categories) {
        const url = 'https://blogs.univ-tlse2.fr/saes/wp-json/wp/v2/categories';
        const cats = [];
        for (cat of categories) {
            const catUrl = url + `?search=${cat}`;
            const response = await fetch(catUrl);
            if (response && response.ok) {
                const data = await response.json();
                if (data[0]) {
                    cats.push(data[0].id);
                } else {
                    window.alert(`Category ${cat} does not exist, skipping`);
                    continue;
                }
            } else {
                console.error('Could not fetch categories from blog');
                continue;
            }
        }
        return cats;
    }

    // Post draft to Wordpress API
    async function submitPost(title, content, categories, tags) {
        const postUrl = 'https://blogs.univ-tlse2.fr/saes/wp-json/wp/v2/posts';
        const cred = 'dGVzdDp3TldLaXJybkZob1VsSnBkU05aWFVmRWo=';
        // const token =
        //     '';
        const headers = new Headers();
        // headers.append('Authorization', 'Bearer ' + token);
        headers.append('Authorization', 'Basic ' + cred);
        headers.append('Content-type', 'application/json');
        let postData = {
            title: title,
            content: content,
            categories: categories,
            tags: tags,
            status: 'draft',
            comment_status: 'closed',
        };
        return fetch(postUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(postData),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.id) {
                    spinner.style.display = 'none';
                    checkmark.style.display = 'inline-block';
                    const id = data.id;
                    return id;
                } else {
                    console.error('Failed to create post: ', data);
                    spinner.style.display = 'none';
                    window.alert(data.message);
                }
            })
            .catch((error) => {
                spinner.style.display = 'none';
                console.error('Error: ', error);
            });
    }

    // Prompt user to send notification email to admins
    function sendMail(id) {
        const mailLink = document.createElement('a');
        const mailSubject = encodeURIComponent(
            `Nouvelle soumission d'intervention médiatique`
        );
        const mailBody = encodeURIComponent(
            `Veuillez consulter la soumission suivante : ${title}, https://blogs.univ-tlse2.fr/saes/wp-admin/post.php?post=${id}&action=edit`
        );
        mailLink.setAttribute(
            'href',
            `mailto:blandine.pennec@univ-tlse2.fr,zachary.baque@univ-tlse2.fr?subject=${mailSubject}&body=${mailBody}`
        );
        mailLink.click();}
});
