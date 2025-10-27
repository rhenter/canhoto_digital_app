import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Basic i18n setup with English (en) and Brazilian Portuguese (pt-BR)
// Add or adjust keys as the app grows. Default language is pt-BR to preserve current UX.

const resources = {
  en: {
    common: {
      loading: 'Loading…',
      retry: 'Try again',
      back: 'Back',
    },
    app: {
      appName: 'Canhoto Digital',
      logout: 'Logout',
    },
    auth: {
      login: 'Sign in',
      username: 'Username',
      password: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in…',
      username_required: 'Username is required',
      password_required: 'Password is required',
    },
    deliveries: {
      title: 'Deliveries',
      loading: 'Loading deliveries…',
      load_error: 'Failed to load deliveries.',
      register_pod: 'Register POD',
    },
    pod: {
      title: 'Register POD',
      received_by_name: 'Received by (name)',
      document_optional: 'Document (optional)',
      note: 'Note',
      photo: 'Photo',
      signature: 'Signature',
      save_signature: 'Save signature',
      clear: 'Clear',
      location: 'Location',
      submit: 'Submit',
      submitting: 'Submitting…',
      back: 'Back',
      save_signature_first: 'Please save the signature before submitting.',
      enter_recipient_name: 'Please enter the recipient name.',
    },
    errors: {
      generic: 'Something went wrong. Please try again.',
      invalid_credentials: 'Invalid credentials',
      login_failed: 'Login failed',
      pod_submit_failed: 'Failed to submit POD. It will be queued for offline submission.',
      upload_failed: 'File upload failed',
    },
  },
  'pt-BR': {
    common: {
      loading: 'Carregando…',
      retry: 'Tentar novamente',
      back: 'Voltar',
    },
    app: {
      appName: 'Canhoto Digital',
      logout: 'Sair',
    },
    auth: {
      login: 'Entrar',
      username: 'Usuário',
      password: 'Senha',
      signIn: 'Entrar',
      signingIn: 'Entrando…',
      username_required: 'Informe o usuário',
      password_required: 'Informe a senha',
    },
    deliveries: {
      title: 'Entregas',
      loading: 'Carregando entregas…',
      load_error: 'Erro ao carregar entregas.',
      register_pod: 'Registrar POD',
    },
    pod: {
      title: 'Registrar POD',
      received_by_name: 'Recebido por (nome)',
      document_optional: 'Documento (opcional)',
      note: 'Observação',
      photo: 'Foto',
      signature: 'Assinatura',
      save_signature: 'Salvar Assinatura',
      clear: 'Limpar',
      location: 'Localização',
      submit: 'Enviar',
      submitting: 'Enviando…',
      back: 'Voltar',
      save_signature_first: 'Salve a assinatura antes de enviar.',
      enter_recipient_name: 'Informe o nome de quem recebeu.',
    },
    errors: {
      generic: 'Algo deu errado. Tente novamente.',
      invalid_credentials: 'Credenciais inválidas',
      login_failed: 'Falha no login',
      pod_submit_failed: 'Falha ao enviar POD. Será enfileirado para envio offline.',
      upload_failed: 'Falha no upload do arquivo',
    },
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR', // default language
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    defaultNS: 'common',
  })

export default i18n
