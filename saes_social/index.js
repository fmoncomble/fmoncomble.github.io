document.addEventListener('DOMContentLoaded', async () => {
    const textarea = document.getElementById('post-text');
    const xBtn = document.getElementById('x-btn');
    const bskyBtn = document.getElementById('bsky-btn');
    const mastoBtn = document.getElementById('masto-btn');
    const resetMasto = document.getElementById('reset-masto');

    // const xAuthBtn = document.getElementById('x-auth-btn');

    // Authorize Bluesky
    const bskyAuthBtn = document.getElementById('bsky-auth-btn');
    let bskyId = sessionStorage.getItem('bsky_id');
    let bskyPwd = sessionStorage.getItem('bsky_pwd');
    let bskyToken = sessionStorage.getItem('bsky_token');
    let bskyRefreshToken = sessionStorage.getItem('bsky_refresh_token');
    let bskyDid = sessionStorage.getItem('bsky_did');
    checkCredentials();
    function checkCredentials() {
        console.log(`Tokens: ${bskyToken} ——— ${bskyRefreshToken}`);
        if (
            !bskyId ||
            !bskyPwd ||
            !bskyToken ||
            !bskyRefreshToken ||
            !bskyDid
        ) {
            bskyAuthBtn.textContent = 'Authorize with Bluesky';
        } else {
            bskyAuthBtn.textContent = 'Reset Bluesky';
        }
    }
    bskyAuthBtn.addEventListener('click', async () => {
        if (!bskyId || !bskyPwd) {
            const bskyDialog = document.getElementById('bsky-dialog');
            const idInput = document.getElementById('id-input');
            const pwdInput = document.getElementById('pwd-input');
            const okBtn = document.getElementById('bsky-ok-btn');
            okBtn.addEventListener('click', async () => {
                bskyId = idInput.value.trim();
                bskyPwd = pwdInput.value.trim();
                if (bskyId && bskyPwd) {
                    sessionStorage.setItem('bsky_id', bskyId);
                    sessionStorage.setItem('bsky_pwd', bskyPwd);
                    bskyAuthBtn.textContent = 'Reset Bluesky';
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
                            checkCredentials();
                        } catch (error) {
                            console.error(
                                ('Could not login to Bluesky: ', error)
                            );
                        }
                    }
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
            checkCredentials();
        }
    });

    const mastoAuthBtn = document.getElementById('masto-auth-btn');
    const composeWrapper = document.getElementById('compose-wrapper');
    let mastoToken = sessionStorage.getItem('masto-token');

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

    function displayThumbnail(img) {
        const div = document.createElement('div');
        const imgElement = document.createElement('img');
        const removeBtn = document.createElement('div');
        removeBtn.classList.add('remove-btn');
        removeBtn.textContent = '✖︎';
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
            for (m of media) {
                const reader = new FileReader();
                reader.readAsDataURL(m);
                const src = await new Promise((resolve) => {
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                });
                const img = await fetch(src).then((res) => res.blob());
                if (img.type !== 'image/png') {
                    window.alert('Only PNG images for 𝕏!');
                    return;
                } else {
                    clipboardItem = new ClipboardItem({ [img.type]: img });
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
        postToBluesky();
    });
    async function postToBluesky() {
        // Refresh token
        bskyToken = await refreshToken();
        async function refreshToken() {
            console.log('Refreshing token');
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
                console.log('Refresh data: ', data);
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
                const src = await new Promise((resolve) => {
                    reader.onload = function (e) {
                        resolve(e.target.result);
                    };
                });
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
        console.log('Post: ', post);
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
                window.open(postUrl);
            }
        } catch (error) {
            console.error('Could not post message: ', error);
        }
    }

    let mastoInstance = sessionStorage.getItem('masto-instance');
    if (mastoInstance) {
        resetMasto.style.display = 'flex';
    }
    mastoBtn.addEventListener('click', () => {
        if (!mastoInstance) {
            const mastoDialog = document.getElementById('masto-dialog');
            const instanceInput = document.getElementById('instance-input');
            const okBtn = document.getElementById('ok-btn');
            okBtn.addEventListener('click', () => {
                mastoInstance = instanceInput.value.trim();
                sessionStorage.setItem('masto-instance', mastoInstance);
                resetMasto.style.display = 'flex';
                mastoDialog.close();
                postToMasto();
            });
            mastoDialog.showModal();
        } else {
            postToMasto();
        }
        function postToMasto() {
            const postText = encodeURIComponent(textarea.value.trim());
            const url = `https://${mastoInstance}/home?text=${postText}`;
            window.open(url);
        }
    });

    resetMasto.addEventListener('click', () => {
        sessionStorage.removeItem('masto-instance');
        mastoInstance = null;
        resetMasto.style.display = 'none';
    });
});
