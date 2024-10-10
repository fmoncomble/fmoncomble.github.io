document.addEventListener('DOMContentLoaded', async () => {
    const textarea = document.getElementById('post-text');
    const xBtn = document.getElementById('x-btn');
    const bskyBtn = document.getElementById('bsky-btn');
    const mastoBtn = document.getElementById('masto-btn');

    // const xAuthBtn = document.getElementById('x-auth-btn');

    // Authorize Bluesky
    const bskyAuthBtn = document.getElementById('bsky-auth-btn');
    let bskyId = sessionStorage.getItem('bsky_id');
    let bskyPwd = sessionStorage.getItem('bsky_pwd');
    let bskyToken = sessionStorage.getItem('bsky_token');
    let bskyRefreshToken = sessionStorage.getItem('bsky_refresh_token');
    let bskyDid = sessionStorage.getItem('bsky_did');
    checkBskyCredentials();
    function checkBskyCredentials() {
        if (
            !bskyId ||
            !bskyPwd ||
            !bskyToken ||
            !bskyRefreshToken ||
            !bskyDid
        ) {
            bskyAuthBtn.textContent = 'Authorize with Bluesky';
            bskyBtn.disabled = true;
        } else {
            bskyAuthBtn.textContent = 'Reset Bluesky';
            bskyBtn.disabled = false;
        }
    }
    bskyAuthBtn.addEventListener('click', async () => {
        if (!bskyId || !bskyPwd) {
            const bskyDialog = document.getElementById('bsky-dialog');
            const idInput = document.getElementById('id-input');
            const pwdInput = document.getElementById('pwd-input');
            const okBtn = document.getElementById('bsky-ok-btn');
            window.addEventListener('click', (e) => {
                if (e.target == bskyDialog) {
                    bskyDialog.close();
                }
            });
            okBtn.addEventListener('click', async () => {
                bskyId = idInput.value.trim();
                bskyPwd = pwdInput.value.trim();
                if (bskyId && bskyPwd) {
                    okBtn.textContent = null;
                    const spinner = document.createElement('div');
                    spinner.classList.add('spinner', 'bsky-auth-spinner');
                    spinner.style.display = 'inline-flex';
                    okBtn.appendChild(spinner);
                    sessionStorage.setItem('bsky_id', bskyId);
                    sessionStorage.setItem('bsky_pwd', bskyPwd);
                    await loginToBluesky();
                    async function loginToBluesky() {
                        try {
                            const res = await fetch(
                                'https://bsky.social/xrpc/com.atproto.server.createSession',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        identifier: bskyId,
                                        password: bskyPwd,
                                    }),
                                }
                            );
                            if (res.ok) {
                                bskyAuthBtn.textContent = '✔︎';
                                const data = await res.json();
                                bskyToken = data.accessJwt;
                                bskyRefreshToken = data.refreshJwt;
                                bskyDid = data.did;
                                sessionStorage.setItem('bsky_token', bskyToken);
                                sessionStorage.setItem(
                                    'bsky_refresh_token',
                                    bskyRefreshToken
                                );
                                sessionStorage.setItem('bsky_did', bskyDid);
                                setTimeout(() => {
                                    checkBskyCredentials();
                                }, 1000);
                            }
                        } catch (error) {
                            console.error(
                                ('Could not login to Bluesky: ', error)
                            );
                        }
                    }
                    spinner.remove();
                    okBtn.textContent = 'OK';
                    bskyDialog.close();
                }
            });
            bskyDialog.showModal();
        } else {
            sessionStorage.removeItem('bsky_id');
            sessionStorage.removeItem('bsky_pwd');
            sessionStorage.removeItem('bsky_token');
            sessionStorage.removeItem('bsky_refresh_token');
            sessionStorage.removeItem('bsky_did');
            bskyId = null;
            bskyPwd = null;
            bskyToken = null;
            bskyRefreshToken = null;
            bskyDid = null;
            checkBskyCredentials();
        }
    });

    // Authorize Mastodon
    const mastoAuthBtn = document.getElementById('masto-auth-btn');
    let mastoInstance = localStorage.getItem('masto_instance');
    let mastoClientId = localStorage.getItem(`${mastoInstance}_id`);
    let mastoClientSecret = localStorage.getItem(`${mastoInstance}_secret`);
    let mastoToken = sessionStorage.getItem('masto_token');
    checkMastoCredentials();
    function checkMastoCredentials() {
        if (!mastoToken) {
            mastoAuthBtn.textContent = 'Authorize with Mastodon';
            mastoBtn.disabled = true;
        } else if (mastoToken) {
            mastoAuthBtn.textContent = 'Reset Mastodon';
            mastoBtn.disabled = false;
        }
    }

    window.onload = async function () {
        if (!mastoToken && mastoInstance) {
            const urlParams = new URLSearchParams(window.location.search);
            code = urlParams.get('code');
            if (code) {
                mastoToken = await getMastoToken(code);
                if (mastoToken) {
                    sessionStorage.setItem('masto_token', mastoToken);
                    checkMastoCredentials();
                }
            }
        }
    };

    mastoAuthBtn.addEventListener('click', async () => {
        if (!mastoToken) {
            const mastoDialog = document.getElementById('masto-dialog');
            const instanceInput = document.getElementById('instance-input');
            const okBtn = document.getElementById('masto-ok-btn');
            okBtn.addEventListener('click', async () => {
                mastoInstance = instanceInput.value.trim();
                localStorage.setItem('masto_instance', mastoInstance);
                if (!mastoClientId && !mastoClientSecret) {
                    await createMastoApp();
                }
                getMastoAuth();
            });
            mastoDialog.showModal();
        } else if (mastoToken) {
            revokeMastoToken();
        }
    });

    const redirectUri = window.location.href.split('?')[0];
    async function createMastoApp() {
        const createAppUrl = `https://${mastoInstance}/api/v1/apps`;
        try {
            const response = await fetch(createAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    client_name: 'SAES Social',
                    redirect_uris: redirectUri,
                    scopes: 'write',
                    website: redirectUri,
                }),
            });
            if (!response.ok) {
                if (response.status === 429) {
                    window.alert('Server busy: try again later');
                    return;
                }
                console.error('Error registering app: ', response.status);
                return;
            }
            const data = await response.json();
            mastoClientId = data.client_id;
            mastoClientSecret = data.client_secret;
            localStorage.setItem(`${mastoInstance}_id`, mastoClientId);
            localStorage.setItem(`${mastoInstance}_secret`, mastoClientSecret);
        } catch (error) {
            console.error('Error registering app: ', error);
        }
    }

    function getMastoAuth() {
        const scope = 'write';
        const authUrl = `https://${mastoInstance}/oauth/authorize?response_type=code&client_id=${mastoClientId}&redirect_uri=${encodeURIComponent(
            redirectUri
        )}&scope=${encodeURIComponent(scope)}`;
        window.location.href = authUrl;
    }

    async function getMastoToken(authCode) {
        const tokenUrl = `https://${mastoInstance}/oauth/token`;
        try {
            const response = await fetch(tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code: authCode,
                    client_id: mastoClientId,
                    client_secret: mastoClientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            });
            const data = await response.json();
            return data.access_token;
        } catch (error) {
            console.error('Error fetching token: ', error);
        }
    }

    async function revokeMastoToken() {
        const formData = new FormData();
        formData.append('client_id', mastoClientId);
        formData.append('client_secret', mastoClientSecret);
        formData.append('token', mastoToken);
        const response = await fetch(`https://${mastoInstance}/oauth/revoke`, {
            method: 'POST',
            mode: 'no-cors',
            body: formData,
        });
        if (response.status === 403) {
            const error = await response.json();
            console.error('Token could not be revoked: ', error);
            window.alert(
                'Could not reset Mastodon authorization: ' +
                    error.error_description
            );
        } else {
            sessionStorage.removeItem('masto_token');
            mastoToken = null;
            checkMastoCredentials();
        }
    }

    // Handle posting interface
    const counter = document.getElementById('counter');
    const charCount = document.getElementById('char-count');
    let textLength = 0;

    textarea.addEventListener('input', () => {
        textLength = textarea.value.length;
        charCount.textContent = textLength;
        if (textLength > 280) {
            counter.style.color = '#cc0000';
            counter.style.fontWeight = 'bold';
        } else {
            counter.removeAttribute('style');
        }
    });

    const dropzone = document.getElementById('dropzone');
    const imgInstructions = document.getElementById('img-instructions');
    const overlay = document.getElementById('overlay');
    const imgPreview = document.getElementById('img-preview');
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        overlay.style.display = 'flex';
    });
    overlay.addEventListener('dragleave', (e) => {
        e.preventDefault();
        overlay.style.display = 'none';
    });
    let media = [];
    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.removeAttribute('style');
        overlay.style.display = 'none';
        imgInstructions.removeAttribute('style');
        let imgs = e.dataTransfer.items;
        for (let img of imgs) {
            if (media.length < 4) {
                let file = img.getAsFile();
                media.push(file);
                displayThumbnail(file);
            } else {
                window.alert('Too many pictures');
                return;
            }
        }
    });

    const imgUpload = document.getElementById('img-upload');
    imgInstructions.onclick = () => {
        imgUpload.click();
    };
    imgUpload.addEventListener('change', (e) => {
        let imgs = e.target.files;
        for (let img of imgs) {
            if (media.length < 4) {
                // let file = img.getAsFile();
                media.push(img);
                displayThumbnail(img);
            } else {
                window.alert('Too many pictures');
                return;
            }
        }
    });

    function displayThumbnail(img) {
        const div = document.createElement('div');
        const imgElement = document.createElement('img');
        const removeBtn = document.createElement('div');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = '❌';
        removeBtn.addEventListener('click', () => {
            const index = media.indexOf(img);
            media.splice(index, 1);
            div.remove();
            if (media.length === 0) {
                imgInstructions.style.display = 'flex';
            }
        });
        const reader = new FileReader();
        reader.onload = function (e) {
            imgElement.src = e.target.result;
            imgElement.style.display = 'inline-block';
        };
        reader.readAsDataURL(img);
        imgInstructions.style.display = 'none';
        imgPreview.appendChild(div);
        div.appendChild(imgElement);
        div.appendChild(removeBtn);
    }

    // Post to X/Twitter
    xBtn.addEventListener('click', () => {
        postToX();
    });

    async function postToX() {
        if (media.length > 0) {
            let clipboardItem;
            // const clipboardItems = [];
            for (m of media) {
                const reader = new FileReader();
                reader.readAsDataURL(m);
                const src = await new Promise((resolve) => {
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                });
                if (m.type === 'image/png') {
                    clipboardItem = new ClipboardItem({ [m.type]: m });
                    // clipboardItems.push(clipboardItem);
                } else {
                    const img = new Image();
                    img.src = src;
                    await new Promise((resolve) => {
                        img.onload = resolve;
                    });
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    const blob = await new Promise((resolve) => {
                        canvas.toBlob(resolve, 'image/png');
                    });
                    clipboardItem = new ClipboardItem({ [blob.type]: blob });
                    // clipboardItems.push(clipboardItem);
                }
            }
            try {
                if (media.length > 1) {
                    window.alert(
                        'Only the last image will be copied to the clipboard'
                    );
                }
                await navigator.clipboard.write([clipboardItem]);
            } catch (error) {
                console.error('Could not write images to the clipboard', error);
            }
        }
        const url = 'https://x.com/intent/post?text=';
        const postText = encodeURIComponent(textarea.value.trim());
        window.open(url + postText);
    }

    // Post to Bluesky
    bskyBtn.addEventListener('click', () => {
        if (!bskyToken || !bskyRefreshToken) {
            window.alert('Authenticate with Bluesky before posting!');
            bskyAuthBtn.style.backgroundColor = '#cc0000';
            bskyAuthBtn.focus();
            setTimeout(() => {
                bskyAuthBtn.removeAttribute('style');
            }, 1000);
            return;
        } else {
            postToBluesky();
        }
    });
    async function postToBluesky() {
        bskyBtn.textContent = null;
        const spinner = document.createElement('div');
        spinner.classList.add('spinner', 'bsky-auth-spinner');
        spinner.style.display = 'inline-flex';
        bskyBtn.appendChild(spinner);
        // Refresh token
        bskyToken = await refreshToken();
        async function refreshToken() {
            try {
                const res = await fetch(
                    'https://bsky.social/xrpc/com.atproto.server.refreshSession',
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${bskyRefreshToken}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                const data = await res.json();
                bskyToken = data.accessJwt;
                bskyRefreshToken = data.refreshJwt;
                sessionStorage.setItem('bsky_token', bskyToken);
                sessionStorage.setItem('bsky_refresh_token', bskyRefreshToken);
                return bskyToken;
            } catch (error) {
                console.error('Could not refresh token: ', error);
            }
        }
        const postText = textarea.value.trim();
        const images = [];
        if (media.length > 0) {
            for (m of media) {
                const reader = new FileReader();
                reader.readAsDataURL(m);
                let src = await new Promise((resolve) => {
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                });
                if (src.length > 1 * 1024 * 1024) {
                    const img = new Image();
                    img.src = src;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const maxWidth = 800;
                    const maxHeight = 800;
                    let width = img.width;
                    let height = img.height;
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    let quality = 0.9;
                    let dataUrl = canvas.toDataURL([m.type], quality);
                    while (dataUrl.length > 1 * 1024 * 1024 && quality > 0.1) {
                        quality -= 0.1;
                        dataUrl = canvas.toDataURL([m.type], quality);
                    }
                    src = dataUrl;
                }
                const image = await fetch(src).then((res) => res.blob());
                try {
                    const res = await fetch(
                        'https://bsky.social/xrpc/com.atproto.repo.uploadBlob',
                        {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${bskyToken}`,
                                'Content-Type': m.type,
                            },
                            body: image,
                        }
                    );
                    const data = await res.json();
                    images.push({ image: data.blob, alt: '' });
                } catch (error) {
                    console.error('Could not upload image: ', error);
                }
            }
        }
        const post = {
            $type: 'app.bsky.feed.post',
            text: postText,
            createdAt: new Date().toISOString(),
        };
        if (images.length > 0) {
            post.embed = {
                $type: 'app.bsky.embed.images',
                images: images,
            };
        }
        try {
            const res = await fetch(
                'https://bsky.social/xrpc/com.atproto.repo.createRecord',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${bskyToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        repo: bskyDid,
                        collection: 'app.bsky.feed.post',
                        record: post,
                    }),
                }
            );
            if (res.ok) {
                const data = await res.json();
                const uriParts = data.uri.split('/');
                const rev = uriParts[uriParts.length - 1];
                const postUrl = `https://bsky.app/profile/${bskyDid}/post/${rev}`;
                spinner.remove();
                bskyBtn.textContent = 'Post to Bluesky';
                window.open(postUrl);
            } else {
                const errorData = await res.json();
                console.error('Could not post to Bluesky: ', errorData);
            }
        } catch (error) {
            console.error('Could not post message: ', error);
        }
    }

    // Post to Mastodon
    mastoBtn.addEventListener('click', () => {
        postToMasto();
    });

    async function postToMasto() {
        mastoBtn.textContent = null;
        const spinner = document.createElement('div');
        spinner.classList.add('spinner', 'masto-spinner');
        spinner.style.display = 'inline-flex';
        mastoBtn.appendChild(spinner);
        let mediaIds;
        if (media.length > 0) {
            mediaIds = await uploadMediaToMasto(media);
        }
        const postText = textarea.value.trim();
        try {
            const res = await fetch(
                `https://${mastoInstance}/api/v1/statuses`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${mastoToken}`,
                        'Content-Type': 'application/json',
                        scope: 'write',
                    },
                    body: JSON.stringify({
                        status: postText,
                        media_ids: mediaIds,
                        visibility: 'public',
                    }),
                }
            );
            if (!res.ok) {
                if (res.status === 401) {
                    window.alert('You are not authorized');
                    return;
                }
                const errorData = await res.json();
                console.error('Error posting toot: ', errorData);
                window.alert('Could not post to Mastodon.');
                return;
            }
            const data = await res.json();
            const postUrl = data.url;
            spinner.remove();
            mastoBtn.textContent = 'Post to Mastodon';
            window.open(postUrl);
        } catch (error) {
            console.error('Could not post to Mastodon: ', error);
        }
    }

    async function uploadMediaToMasto(media) {
        const mediaIds = [];
        for (let m of media) {
            const formData = new FormData();
            formData.append('file', m);
            try {
                const res = await fetch(
                    `https://${mastoInstance}/api/v2/media`,
                    {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${mastoToken}`,
                            scope: 'write',
                        },
                        body: formData,
                    }
                );
                if (!res.ok) {
                    if (res.status === 401) {
                        window.alert('You are not authorized');
                        return;
                    }
                    const errorData = await res.json();
                    console.error('Error uploading media: ', errorData);
                    window.alert(
                        'A media file could not be uploaded: ' + errorData.error
                    );
                    return;
                }
                const data = await res.json();
                const id = data.id;
                mediaIds.push(id);
            } catch (error) {
                console.error('Upload error: ', error);
            }
        }
        return mediaIds;
    }
});
