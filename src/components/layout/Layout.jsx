import PropTypes from 'prop-types';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

/**
 * Layout Component
 * Main layout wrapper with navbar and optional sidebar
 */
export default function Layout({
  children,
  showSidebar = false,
  showAuthLinks = true,
  maxWidth = '7xl',
}) {
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar showAuthLinks={showAuthLinks} />

      <div className="flex">
        {showSidebar && <Sidebar isOpen={showSidebar} />}

        <main
          className={`
            flex-1
            ${showSidebar ? 'lg:pl-64' : ''}
            ${showSidebar ? 'pt-0' : 'pt-0'}
          `}
        >
          <div className={`${maxWidthClasses[maxWidth]} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  showSidebar: PropTypes.bool,
  showAuthLinks: PropTypes.bool,
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']),
};
