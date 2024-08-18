document.addEventListener('DOMContentLoaded', async function () {
    const tokenInputDiv = document.getElementById('token-input-div');
    const instanceInput = document.getElementById('instance-input');
    const instanceBtn = document.getElementById('instance-btn');
    const tokenInput = document.getElementById('token-input');
    const tokenBtn = document.getElementById('token-btn');
    const contentContainer = document.getElementById('content-container');
    const postItem = document.getElementById('post-item');
    const postThreadBtn = document.getElementById('post-thread-btn');

    let maxChars;
    let maxMedia;
    let postItems = [];
    let files = {};

    let instance;
    checkInstance();
    let token;
    checkToken();

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
            if (postItems.length === 0) {
                await getMax();
                createNewPost();
                postThreadBtn.style.display = 'flex';
            }
        } else if (!token) {
            if (instance)
                instanceInput.value = instance + ' (⚠️ Saisissez votre jeton)';
            tokenInputDiv.style.display = 'block';
        }
    }

    function removeToken() {
        localStorage.removeItem('mastothreadtoken');
        tokenInput.value = null;
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
            tokenInputDiv.style.display = 'block';
            tokenInput.focus();
            checkInstance();
            checkToken();
        }
    });

    instanceBtn.addEventListener('click', () => {
        if (instanceInput.disabled) {
            instanceInput.value = null;
            instanceInput.disabled = false;
            instanceBtn.textContent = 'Valider';
            localStorage.removeItem('mastothreadinstance');
            removeToken();
            tokenInputDiv.style.display = 'none';
            tokenInput.disabled = false;
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
            tokenInputDiv.style.display = 'block';
            tokenInput.focus();
            checkInstance();
            checkToken();
        }
    });

    tokenInput.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') {
            token = tokenInput.value;
            if (!token) {
                window.alert("Veuillez entrer votre jeton d'authentification");
                return;
            }
            localStorage.setItem('mastothreadtoken', token);
            tokenBtn.style.backgroundColor = 'green';
            tokenInput.style.backgroundColor = '#e6ffe6';
            setTimeout(() => {
                tokenBtn.removeAttribute('style');
                tokenInput.removeAttribute('style');
                tokenInputDiv.style.display = 'none';
            }, 1000);
            tokenInput.disabled = true;
            checkInstance();
            checkToken();
            if (postItems.length === 0) {
                createNewPost();
            }
            postThreadBtn.style.display = 'flex';
        }
    });

    tokenBtn.addEventListener('click', async () => {
        token = tokenInput.value;
        if (!token) {
            window.alert("Veuillez entrer votre jeton d'authentification");
            return;
        }
        localStorage.setItem('mastothreadtoken', token);
        tokenBtn.style.backgroundColor = 'green';
        tokenInput.style.backgroundColor = '#e6ffe6';
        setTimeout(() => {
            tokenBtn.removeAttribute('style');
            tokenInput.removeAttribute('style');
            tokenInputDiv.style.display = 'none';
        }, 1000);
        tokenInput.disabled = true;
        checkInstance();
        checkToken();
        if (postItems.length === 0) {
            createNewPost();
        }
        postThreadBtn.style.display = 'flex';
    });

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
    function createNewPost() {
        const newPost = postItem.cloneNode(true);
        postItems.push(newPost);
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
        contentContainer.appendChild(newPost);

        updatePostCount();

        const textarea = newPost.querySelector('textarea');
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
            console.log('Current number of files: ', files[`files${i}`].length);
            console.log('Number of new files: ', newFiles.length);
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
            console.log(
                files[`files${i}`].length + ' files dropped: ',
                files[`files${i}`]
            );
            console.log('Total files: ', files);
        });

        function displayThumbnail(file, imgPreview, imgCount, dzInst) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                const img = document.createElement('img');
                const removeBtn = document.createElement('button');
                const overlay = document.createElement('div');

                img.src = e.target.result;
                removeBtn.textContent = 'x';
                removeBtn.classList.add('remove-btn');
                overlay.classList.add('overlay');

                removeBtn.addEventListener('click', () => {
                    const index = files[`files${i}`].indexOf(file);
                    if (index > -1) {
                        files[`files${i}`].splice(index, 1);
                    }
                    div.remove();
                    imgCount.textContent = `${files.length}/${maxMedia}`;
                    if (files[`files${i}`].length === 0) {
                        dzInst.style.display = 'block';
                    }
                    console.log('File removed: ', file);
                    console.log('Files remaining: ', files[`files${i}`]);
                    console.log('Total files: ', files);
                });

                div.appendChild(img);
                div.appendChild(overlay);
                div.appendChild(removeBtn);
                imgPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        }

        const addPostBtn = newPost.querySelector('.add-post-btn');
        addPostBtn.addEventListener('click', () => {
            createNewPost();
        });

        const deletePostBtn = newPost.querySelector('.delete-post-btn');
        deletePostBtn.addEventListener('click', () => {
            const index = postItems.indexOf(newPost);
            if (postItems.length > 1) {
                const id = newPost.id.split('-')[1];
                postItems.splice(index, 1);
                console.log('Post deleted, remaining posts: ', postItems);
                newPost.remove();
                delete files[`files${id}`];
                console.log('Files remaining: ', files);
                updatePostCount();
                if (postItems.length === 1) {
                    const post = postItems[0];
                    const delBtn = post.querySelector('.delete-post-btn');
                    delBtn.style.display = 'none';
                }
            }
        });
    }

    // function displayThumbnail(file, imgPreview, imgCount, dzInst) {
    //     const reader = new FileReader();
    //     reader.onload = (e) => {
    //         const div = document.createElement('div');
    //         const img = document.createElement('img');
    //         const removeBtn = document.createElement('button');
    //         const overlay = document.createElement('div');

    //         img.src = e.target.result;
    //         removeBtn.textContent = 'x';
    //         removeBtn.classList.add('remove-btn');
    //         overlay.classList.add('overlay');

    //         removeBtn.addEventListener('click', () => {
    //             const index = files.indexOf(file);
    //             if (index > -1) {
    //                 files.splice(index, 1);
    //             }
    //             div.remove();
    //             imgCount.textContent = `${files.length}/${maxMedia}`;
    //             if (files.length === 0) {
    //                 dzInst.style.display = 'block';
    //             }
    //             console.log('File removed: ', file);
    //             console.log('Files remaining: ', files);
    //         });

    //         div.appendChild(img);
    //         div.appendChild(overlay);
    //         div.appendChild(removeBtn);
    //         imgPreview.appendChild(div);
    //     };
    //     reader.readAsDataURL(file);
    // }

    function updatePostCount() {
        for (let p of postItems) {
            const i = postItems.indexOf(p);
            const pNo = i + 1;
            const postCount = p.querySelector('.post-count');
            postCount.textContent = `Pouet ${pNo}/${postItems.length}`;
        }
    }

    postThreadBtn.addEventListener('click', () => {
        postThread();
    });

    async function postThread() {
        for (let post of postItems) {
            console.log('Access token: ', token);
            const i = postItems.indexOf(post);

            const textarea = post.querySelector('textarea');
            const postText = textarea.value;
            console.log('Post text: ', postText);

            const id = post.id.split('-')[1];
            const media = files[`files${id}`];
            let mediaIds = [];
            if (media) {
                console.log('Files to upload: ', media);
                for (let m of media) {
                    console.log('Media to upload: ', m);
                    const formData = new FormData();
                    formData.append('file', m);
                    console.log('FormData: ', formData);

                    try {
                        const response = await fetch(
                            `https://${instance}/api/v2/media`,
                            {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    scope: 'write'
                                },
                                body: formData,
                            }
                        );

                        if (!response.ok) {
                            const errorData = await response.json();
                            console.error('Error uploading media: ', errorData);
                            continue;
                        }

                        const data = await response.json();
                        mediaIds.push(data.id);
                        console.log('Media ids: ', mediaIds);
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
                            scope: 'write'
                        },
                        body: JSON.stringify({
                            status: postText,
                            media_ids: mediaIds,
                            visibility: 'private',
                        }),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error posting status: ', errorData);
                    continue;
                }
                const data = await response.json();
                console.log('Post data: ', data);
            } catch (error) {
                console.error('Fetch error: ', error);
            }
        }
    }
});
