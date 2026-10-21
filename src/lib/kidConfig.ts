import type { KidDeclare } from '@k-id/core'

// k-ID test key for Curio (publishable keys are safe to ship in the browser).
export const KID_PUBLISHABLE_KEY =
  'kgp_test_fsevj4ehppaaaeyvyvrvbhzhalh6rscrvvgebiugqejb5hmd3lerlvmqyrlrlkq'
export const KID_BASE_URL = 'https://kai-api.test.k-id.com/fapi/v1'

// Features Curio really has, one k-ID capability each (names from PERMISSIONS.md).
export const KID_DECLARE: KidDeclare = {
  permissions: [
    { name: 'camera-access' }, // webcam "Snap & Explore" scanner
    { name: 'ai-media-upload' }, // the snapshot is sent to the AI to identify the object
    { name: 'ai-chat' }, // ask the Curio owl questions about the object
    { name: 'ai-voice-mode' }, // talk to the owl by voice (Modulate in, Inworld out)
    { name: 'personalized-recommendations' }, // lessons adapted to the player's age and mood
  ],
  // TODO(Shehryar): fill these in. Optional ones left out keep what k-ID already has.
  // privacyPolicyUrl: 'https://...',
  // termsOfServiceUrl: 'https://...',
  // iconUrl: '/icon.png',
  supportEmail: 'shehryar.hassan@uni.minerva.edu', // help address k-ID's emails give parents and players
}
