// Lightweight placeholder for next/dynamic's `loading` while the three.js chunk downloads.
import styles from './ObjectViewer.module.css'

export default function ViewerLoading({ text = 'Building your 3D model…' }: { text?: string }) {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.loadingCenter}>
        <div className={styles.loadingCard}>
          <span className={styles.spinner} aria-hidden />
          {text}
        </div>
      </div>
    </div>
  )
}
