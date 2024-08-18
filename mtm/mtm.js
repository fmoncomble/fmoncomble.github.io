document.addEventListener('DOMContentLoaded', async function () {
    const authDiv = document.getElementById('auth-div');
    const instructionsDiv = document.getElementById('instructions');
    const instanceInput = document.getElementById('instance-input');
    const instanceBtn = document.getElementById('instance-btn');
    const clientDiv = document.getElementById('client-div');
    const clientIdInput = document.getElementById('client-id-input');
    const saveIdBtn = document.getElementById('save-id-btn');
    const secretDiv = document.getElementById('secret-div');
    const clientSecretInput = document.getElementById('client-secret-input');
    const saveSecretBtn = document.getElementById('save-secret-btn');
    const codeDiv = document.getElementById('code-div');
    const codeInput = document.getElementById('code-input');
    const saveCodeBtn = document.getElementById('save-code-btn');
    const contentContainer = document.getElementById('content-container');
    const postItem = document.getElementById('post-item');
    const postThreadBtn = document.getElementById('post-thread-btn');
    const spinner = document.getElementById('spinner');
    const viewThreadBtn = document.getElementById('view-thread-btn');
    const viewThreadLink = viewThreadBtn.querySelector('a');

    let maxChars;
    let maxMedia;
    let postItems = [];
    let files = {};

    let instance;
    checkInstance();
    let token;
    checkToken();

    clientIdInput.value = null;
    clientSecretInput.value = null;
    codeInput.value = null;

    let clientId;
    let clientSecret;
    let code;

    function checkInstance() {
        instance = localStorage.getItem('mastothreadinstance');
        if (instance) {
            instanceInput.value = instance;
            instanceBtn.textContent = 'Changer';
            instanceInput.disabled = true;
        } else if (!instance) {
            instanceInput.value = null;
            instanceBtn.textContent = 'Valider';
            instanceInput.disabled = false;
        }
    }

    async function checkToken() {
        token = localStorage.getItem('mastothreadtoken');
        if (token) {
            instanceInput.value = instance + ' (jeton enregistré) ✅';
            authDiv.style.display = 'none';
            instructionsDiv.style.display = 'none';
            if (postItems.length === 0) {
                await getMax();
                createNewPost();
                postThreadBtn.style.display = 'flex';
            }
        } else if (!token) {
            instructionsDiv.style.display = 'block';
            if (instance) {
                instanceInput.value =
                    instance + ' (⚠️ Saisissez vos informations)';
                authDiv.style.display = 'block';
                clientIdInput.focus();
            }
        }
    }

    function removeToken() {
        localStorage.removeItem('mastothreadtoken');
    }

    instanceInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            instance = instanceInput.value;
            if (!instance) {
                window.alert('Veuillez indiquer votre instance Mastodon');
                return;
            }
            localStorage.setItem('mastothreadinstance', instance);
            removeToken();
            instanceBtn.textContent = 'Changer';
            const mastoUrl = 'https://' + instance + '/settings/applications';
            window.open(mastoUrl, '_blank');
            authDiv.style.display = 'block';
            clientDiv.style.display = 'block';
            clientIdInput.focus();
            checkInstance();
            checkToken();
        }
    });

    instanceBtn.addEventListener('click', () => {
        if (instanceInput.disabled) {
            instanceInput.value = null;
            clientIdInput.value = null;
            clientSecretInput.value = null;
            codeInput.value = null;
            codeDiv.style.display = 'none';
            instanceInput.disabled = false;
            instanceBtn.textContent = 'Valider';
            localStorage.removeItem('mastothreadinstance');
            removeToken();
            authDiv.style.display = 'none';
            clientDiv.style.display = 'none';
            secretDiv.style.display = 'none';
            checkInstance();
            checkToken();
        } else {
            instance = instanceInput.value;
            if (!instance) {
                window.alert('Veuillez indiquer votre instance Mastodon');
                return;
            }
            localStorage.setItem('mastothreadinstance', instance);
            removeToken();
            instanceBtn.textContent = 'Changer';
            const mastoUrl = 'https://' + instance + '/settings/applications';
            window.open(mastoUrl, '_blank');
            authDiv.style.display = 'block';
            clientDiv.style.display = 'block';
            clientIdInput.focus();
            checkInstance();
            checkToken();
        }
    });

    saveIdBtn.addEventListener('click', () => {
        clientId = clientIdInput.value.trim();
        secretDiv.style.display = 'block';
        clientSecretInput.focus();
    });

    clientIdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clientId = clientIdInput.value.trim();
            secretDiv.style.display = 'block';
            clientSecretInput.focus();
        }
    });

    saveSecretBtn.addEventListener('click', () => {
        clientSecret = clientSecretInput.value.trim();
        redirectToAuthServer();
        clientDiv.style.display = 'none';
        secretDiv.style.display = 'none';
        codeDiv.style.display = 'block';
        codeInput.focus();
    });

    clientSecretInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clientSecret = clientSecretInput.value.trim();
            redirectToAuthServer();
            clientDiv.style.display = 'none';
            secretDiv.style.display = 'none';
            codeDiv.style.display = 'block';
            codeInput.focus();
        }
    });

    saveCodeBtn.addEventListener('click', async () => {
        code = codeInput.value.trim();
        token = await exchangeCodeForToken(code);
        if (token) {
            localStorage.setItem('mastothreadtoken', token);
            checkToken();
        }
    });

    codeInput.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            code = codeInput.value.trim();
            token = await exchangeCodeForToken(code);
            if (token) {
                localStorage.setItem('mastothreadtoken', token);
                checkToken();
            }
        }
    });

    const redirectUri = 'urn:ietf:wg:oauth:2.0:oob';
    function redirectToAuthServer() {
        const scope = 'read write follow';
        const authUrl = `https://${instance}/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&scope=${encodeURIComponent(scope)}`;

        window.open(authUrl, '_blank');
    }

    async function exchangeCodeForToken(authCode) {
        const tokenUrl = `https://${instance}/oauth/token`;

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                code: authCode,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        });
        const data = await response.json();
        return data.access_token;
    }

    async function getMax() {
        const response = await fetch(`https://${instance}/api/v1/instance`);
        if (!response.ok) {
            console.error('Could not fetch instance');
            return;
        }
        const data = await response.json();
        maxChars = Number(data.configuration.statuses.max_characters);
        maxMedia = Number(data.configuration.statuses.max_media_attachments);
    }

    let i = 0;
    let defaultViz = 'public';
    let currentPost;
    function createNewPost() {
        const newPost = postItem.cloneNode(true);
        const addPostBtn = newPost.querySelector('.add-post-btn');
        if (postItems.length === 0) {
            contentContainer.appendChild(newPost);
            postItems.push(newPost);
        } else {
            currentPost.after(newPost);
            const currentIndex = postItems.indexOf(currentPost);
            const newIndex = currentIndex + 1;
            postItems.splice(newIndex, 0, newPost);
        }
        const vizSelect = newPost.querySelector('.viz-select');
        const index = postItems.indexOf(newPost);
        if (index === 0) {
            vizSelect.value = 'public';
            vizSelect.addEventListener('change', () => {
                defaultViz = vizSelect.value;
            });
        } else {
            vizSelect.value = 'unlisted';
        }
        i++;
        newPost.id = 'post-' + i;
        files[`files${i}`] = [];
        for (let p of postItems) {
            const deletePostBtn = p.querySelector('.delete-post-btn');
            if (postItems.length > 1) {
                deletePostBtn.style.display = 'inline-block';
            }
        }
        newPost.style.display = 'block';
        addPostBtn.addEventListener('click', () => {
            if (postItems.length > 0) {
                currentPost = addPostBtn.parentElement;
            }
            createNewPost();
        });

        updatePostCount();

        const textarea = newPost.querySelector('.post-text');
        textarea.value = null;
        const charCount = newPost.querySelector('.char-count');
        charCount.textContent = `0/${maxChars}`;

        textarea.addEventListener('input', () => {
            const postText = textarea.value;
            charCount.textContent = `${postText.length}/${maxChars}`;
            if (postText.length > maxChars) {
                charCount.style.color = '#cc0000';
                charCount.style.fontWeight = 'bold';
            } else {
                charCount.removeAttribute('style');
            }
        });

        const cwDiv = newPost.querySelector('.cw-div');
        const cwText = newPost.querySelector('.cw-text');
        const cwBtn = newPost.querySelector('.cw-btn');
        cwBtn.addEventListener('click', () => {
            if (cwDiv.style.display === 'none') {
                cwDiv.style.display = 'inline-flex';
                cwBtn.style.color = '#cc0000';
                cwBtn.style.borderColor = '#cc0000';
                cwBtn.style.textDecorationLine = 'line-through';
                cwBtn.title = "Supprimer l'avertissement";
            } else {
                cwText.value = null;
                cwDiv.style.display = 'none';
                cwBtn.removeAttribute('style');
                cwBtn.title = 'Ajouter un avertissement';
            }
        });

        const imgCount = newPost.querySelector('.img-count');
        imgCount.textContent = `0/${maxMedia}`;

        const dropzone = newPost.querySelector('.dropzone');
        const dzInst = dropzone.querySelector('.dz-inst');
        const imgPreview = dropzone.querySelector('.img-preview');

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dz-active');
        });

        dropzone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dz-active');
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dz-active');
            dzInst.style.display = 'none';
            const newFiles = e.dataTransfer.files;
            if (files[`files${i}`].length >= maxMedia) {
                window.alert("Le nombre maximum d'images est atteint.");
                return;
            } else {
                for (let f of newFiles) {
                    if (files[`files${i}`].length < maxMedia) {
                        files[`files${i}`].push(f);
                        displayThumbnail(f, imgPreview, imgCount, dzInst);
                        imgCount.textContent = `${
                            files[`files${i}`].length
                        }/${maxMedia}`;
                    } else {
                        window.alert("Le nombre maximum d'images est atteint");
                        break;
                    }
                }
            }
        });

        function displayThumbnail(file, imgPreview, imgCount, dzInst) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                const img = document.createElement('img');
                const removeBtn = document.createElement('button');

                img.src = e.target.result;
                removeBtn.textContent = 'X';
                removeBtn.classList.add('remove-btn');

                removeBtn.addEventListener('click', () => {
                    const index = files[`files${i}`].indexOf(file);
                    if (index > -1) {
                        files[`files${i}`].splice(index, 1);
                    }
                    div.remove();
                    imgCount.textContent = `${
                        files[`files${i}`].length
                    }/${maxMedia}`;
                    if (files[`files${i}`].length === 0) {
                        dzInst.style.display = 'block';
                    }
                });

                div.appendChild(img);
                div.appendChild(removeBtn);
                imgPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }

        const deletePostBtn = newPost.querySelector('.delete-post-btn');
        deletePostBtn.addEventListener('click', () => {
            const index = postItems.indexOf(newPost);
            if (postItems.length > 1) {
                const id = newPost.id.split('-')[1];
                postItems.splice(index, 1);
                newPost.remove();
                delete files[`files${id}`];
                updatePostCount();
                if (postItems.length === 1) {
                    const post = postItems[0];
                    const delBtn = post.querySelector('.delete-post-btn');
                    delBtn.style.display = 'none';
                }
            }
            const firstPost = postItems[0];
            const firstVizSelect = firstPost.querySelector('.viz-select');
            firstVizSelect.value = defaultViz;
        });
    }

    function updatePostCount() {
        for (let p of postItems) {
            const i = postItems.indexOf(p);
            const pNo = i + 1;
            const postCount = p.querySelector('.post-count');
            postCount.textContent = `Pouet ${pNo}/${postItems.length}`;
        }
    }

    let threadUrl;
    postThreadBtn.addEventListener('click', async () => {
        await postThread();
        spinner.style.display = 'none';
        postThreadBtn.style.display = 'none';
        viewThreadLink.setAttribute('href', threadUrl);
        viewThreadBtn.addEventListener('click', () => {
            window.open(threadUrl, '_blank');
        });
        viewThreadBtn.style.display = 'flex';
    });

    async function postThread() {
        spinner.style.display = 'inline-flex';
        let replyToId;
        for (let post of postItems) {
            const i = postItems.indexOf(post);

            const vizSelect = post.querySelector('.viz-select');
            const visibility = vizSelect.value;
            const cwTextArea = post.querySelector('.cw-text');
            let cwText;
            if (cwTextArea.value) {
                cwText = cwTextArea.value;
            }
            const textarea = post.querySelector('.post-text');
            const postText = textarea.value;

            const id = post.id.split('-')[1];
            const media = files[`files${id}`];
            let mediaIds = [];
            if (media) {
                for (let m of media) {
                    const formData = new FormData();
                    formData.append('file', m);

                    try {
                        const response = await fetch(
                            `https://${instance}/api/v2/media`,
                            {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    scope: 'write',
                                },
                                body: formData,
                            }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Error uploading media: ', errorData);
                            window.alert(
                                `Un fichier attaché au pouet n°${id} n'a pas pu être envoyé`
                            );
                            return;
                        }

                        const data = await response.json();
                        mediaIds.push(data.id);
                    } catch (error) {
                        console.error('Fetch error: ', error);
                    }
                }
            }

            try {
                const response = await fetch(
                    `https://${instance}/api/v1/statuses`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                            scope: 'write',
                        },
                        body: JSON.stringify({
                            status: postText,
                            media_ids: mediaIds,
                            spoiler_text: cwText,
                            visibility: visibility,
                            in_reply_to_id: replyToId,
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error posting status: ', errorData);
                    window.alert(`Le pouet n°${id} n'a pas pu être envoyé.`);
                    return;
                }
                const data = await response.json();
                replyToId = data.id;
                if (i === 0) {
                    threadUrl = data.url;
                }
            } catch (error) {
                console.error('Fetch error: ', error);
            }
        }
    }
});
