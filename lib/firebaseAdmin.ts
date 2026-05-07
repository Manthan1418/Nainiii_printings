import admin from 'firebase-admin'

function initFirebaseAdmin() {
  if (admin.apps.length) return admin.app()

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  let cred: admin.ServiceAccount | undefined
  if (serviceAccount) {
    try {
      const parsed = JSON.parse(serviceAccount)
      cred = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
      }
    } catch (e) {
      console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY')
    }
  }

  if (cred) {
    return admin.initializeApp({ credential: admin.credential.cert(cred) })
  }

  // fallback to application default credentials
  return admin.initializeApp()
}

export const firebaseAdmin = initFirebaseAdmin()
export const auth = firebaseAdmin.auth()
export const firestore = firebaseAdmin.firestore()
