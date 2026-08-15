/**
 * Helper to convert a Base64URL string to an ArrayBuffer.
 */
function base64urlToBuffer(base64url) {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;
    const binary = window.atob(padded);
    const buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
}

/**
 * Helper to convert an ArrayBuffer to a Base64URL string.
 */
function bufferToBase64url(buffer) {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    return window.btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

/**
 * Returns true if the App is using the Native Android Biometric Bridge
 */
export function isNativeBiometric() {
    return !!window.AndroidBiometric;
}

/**
 * Check if the browser supports WebAuthn and if biometrics are available.
 */
export async function isBiometricAvailable() {
    const ua = navigator.userAgent;
    console.log("[Biometric Diagnostic] UserAgent:", ua);
    console.log("[Biometric Diagnostic] current WebView URL:", window.location.href);

    if (window.AndroidBiometric) {
        console.log("[Biometric Diagnostic] Native AndroidBiometric bridge detected!");
        return window.AndroidBiometric.isBiometricAvailable();
    }

    console.log("[Biometric Diagnostic] PublicKeyCredential exists:", !!window.PublicKeyCredential);

    if (!window.PublicKeyCredential) {
        console.warn("[Biometric] WebAuthn NOT supported in this browser.");
        return false;
    }
    
    try {
        if (window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            console.log("[Biometric Diagnostic] isUserVerifyingPlatformAuthenticatorAvailable():", available);
            return available;
        } else {
            console.log("[Biometric Diagnostic] isUserVerifyingPlatformAuthenticatorAvailable does NOT exist on PublicKeyCredential");
        }
    } catch (e) {
        console.error("[Biometric Diagnostic] Availability check error:", e);
    }
    
    return false;
}

/**
 * Register a new biometric credential.
 */
export async function registerBiometric(challengeData) {
    console.log("[Biometric] Starting registration flow...");
    if (!challengeData || !challengeData.challenge || !challengeData.user) {
        throw new Error("Invalid registration challenge data received from server.");
    }
    
    try {
        const options = {
            publicKey: {
                challenge: base64urlToBuffer(challengeData.challenge),
                rp: challengeData.rp,
                user: {
                    ...challengeData.user,
                    id: new TextEncoder().encode(String(challengeData.user.id))
                },
                pubKeyCredParams: [
                    { type: "public-key", alg: -7 }, // ES256
                    { type: "public-key", alg: -257 } // RS256
                ],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "preferred"
                },
                timeout: 60000
            }
        };

        const credential = await navigator.credentials.create(options);
        console.log("[Biometric] Native registration successful.");
        
        let publicKeyBase64 = "";
        if (credential.response && credential.response.getPublicKey) {
            publicKeyBase64 = bufferToBase64url(credential.response.getPublicKey());
        }

        return {
            credentialID: bufferToBase64url(credential.rawId),
            publicKey: publicKeyBase64,
            type: credential.type
        };
    } catch (err) {
        console.error("[Biometric] Native registration failed:", err);
        throw err;
    }
}

/**
 * Authenticate using biometrics.
 */
export async function authenticateBiometric(challengeData) {
    console.log("[Biometric] Starting authentication flow...");

    if (window.AndroidBiometric) {
        console.log("[Biometric Diagnostic] Using Native AndroidBiometric authentication.");
        return new Promise((resolve, reject) => {
            const callbackId = "bio_" + Date.now();
            window.onBiometricResult = (id, success, message) => {
                if (id === callbackId) {
                    delete window.onBiometricResult;
                    if (success) {
                        resolve({ nativeUnlock: true });
                    } else {
                        reject(new Error(message));
                    }
                }
            };
            window.AndroidBiometric.authenticate(callbackId);
        });
    }

    if (!challengeData || !challengeData.challenge || !challengeData.allowCredentials) {
        throw new Error("Invalid authentication challenge data received from server.");
    }

    try {
        const options = {
            publicKey: {
                challenge: base64urlToBuffer(challengeData.challenge),
                allowCredentials: challengeData.allowCredentials.map(c => ({
                    id: base64urlToBuffer(c.id),
                    type: "public-key"
                })),
                userVerification: "required",
                timeout: 60000
            }
        };

        const assertion = await navigator.credentials.get(options);
        console.log("[Biometric] Native authentication successful.");
        
        return {
            credentialID: bufferToBase64url(assertion.rawId),
            signature: bufferToBase64url(assertion.response.signature),
            authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
            clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON)
        };
    } catch (err) {
        console.error("[Biometric Diagnostic] Native authentication failed. DOMException name:", err.name, "message:", err.message, "stack:", err.stack);
        throw err;
    }
}
