'use client';

import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) {
    return null;
  }

  const getDisplayName = () => {
    if (session.user.name) {
      return session.user.name;
    }
    if (session.user.email) {
      return session.user.email.split('@')[0];
    }
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        <div style={styles.logoSection}>
          <h2 style={styles.logo}>Kanban Board</h2>
        </div>

        <div style={styles.userSection}>
          <span style={styles.userName}>{displayName}</span>
          <div style={styles.userAvatar}>
            {displayName.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.target.style.background = styles.logoutButtonHover.background;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = styles.logoutButton.background;
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    background: 'var(--jira-bg-card)',
    borderBottom: '2px solid var(--jira-border)',
    padding: '12px 0',
    boxShadow: 'var(--shadow-sm)',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'var(--jira-text-primary)',
    margin: 0,
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    color: 'var(--jira-text-secondary)',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'var(--jira-blue)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: 'white',
  },
  logoutButton: {
    padding: '6px 12px',
    background: 'rgba(9, 30, 66, 0.04)',
    color: 'var(--jira-text-secondary)',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '400',
    transition: 'background-color 0.2s ease',
  },
  logoutButtonHover: {
    background: 'rgba(9, 30, 66, 0.08)',
  },
};