import { VERSION_STRING, APP_VERSION, BUILD_DATE } from '../version';

/**
 * VersionDisplay - Shows app version in footer or settings
 */
const VersionDisplay = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="text-xs text-gray-500">
        v{APP_VERSION}
      </div>
    );
  }

  return (
    <div className="text-center text-xs text-gray-500 space-y-1">
      <div className="font-semibold">PinoyPOS v{APP_VERSION}</div>
      <div>Built: {new Date(BUILD_DATE).toLocaleDateString()}</div>
      <div className="text-gray-400">
        {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
      </div>
    </div>
  );
};

export default VersionDisplay;
