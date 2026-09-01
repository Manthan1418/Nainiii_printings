import admin from 'firebase-admin'

let firebaseAdminApp: admin.app.App | null = null

function initFirebaseAdmin() {
  if (firebaseAdminApp) return firebaseAdminApp
  if (admin.apps.length) {
    firebaseAdminApp = admin.app()
    return firebaseAdminApp
  }

  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (!serviceAccount) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not set')
  }

  try {
    const parsed = JSON.parse(serviceAccount)
    const cred: admin.ServiceAccount = {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key?.replace(/\\n/g, '\n'),
    }
    firebaseAdminApp = admin.initializeApp({ credential: admin.credential.cert(cred) })
    return firebaseAdminApp
  } catch (e) {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY')
  }
}

function createLazyServiceProxy<T extends object>(loader: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop, receiver) {
      const service = loader()
      const value = Reflect.get(service as object, prop, receiver)
      return typeof value === 'function' ? value.bind(service) : value
    },
    set(_target, prop, value) {
      const service = loader()
      return Reflect.set(service as object, prop, value)
    },
    has(_target, prop) {
      const service = loader()
      return prop in service
    },
  })
}

export const auth = createLazyServiceProxy(() => initFirebaseAdmin().auth())
export const firestore = createLazyServiceProxy(() => initFirebaseAdmin().firestore())
