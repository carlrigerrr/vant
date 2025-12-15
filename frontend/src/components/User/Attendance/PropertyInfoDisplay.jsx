/**
 * PropertyInfoDisplay - Shows Client Bible info to employees
 * Used on check-in screen before employee arrives at location
 */
import React, { useState } from 'react';

const PropertyInfoDisplay = ({ propertyDetails, clientName }) => {
    const [expanded, setExpanded] = useState(false);

    // Check if there's any info to display
    const hasInfo = propertyDetails && (
        propertyDetails.entryInstructions ||
        propertyDetails.alarmCode ||
        propertyDetails.gateCode ||
        propertyDetails.keyLocation ||
        propertyDetails.parkingInstructions ||
        propertyDetails.petInfo ||
        propertyDetails.clientPreferences ||
        propertyDetails.areasToAvoid
    );

    if (!hasInfo) {
        return null;
    }

    return (
        <div className="mt-4 border border-blue-200 rounded-lg bg-blue-50 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-blue-100 transition"
            >
                <div className="flex items-center gap-2">
                    <span className="text-xl">📋</span>
                    <span className="font-medium text-gray-800">Property Info</span>
                </div>
                <span className="text-gray-500 text-lg">
                    {expanded ? '▲' : '▼'}
                </span>
            </button>

            {expanded && (
                <div className="px-4 pb-4 space-y-3">
                    {/* Entry & Access */}
                    {(propertyDetails.entryInstructions || propertyDetails.keyLocation) && (
                        <div className="bg-white rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-green-700 mb-2">🚪 Entry</h4>
                            {propertyDetails.entryInstructions && (
                                <p className="text-sm text-gray-700 mb-1">
                                    {propertyDetails.entryInstructions}
                                </p>
                            )}
                            {propertyDetails.keyLocation && (
                                <p className="text-sm text-gray-600">
                                    🔑 Key: {propertyDetails.keyLocation}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Security Codes */}
                    {(propertyDetails.alarmCode || propertyDetails.gateCode) && (
                        <div className="bg-white rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-red-700 mb-2">🔐 Codes</h4>
                            <div className="flex gap-4 flex-wrap">
                                {propertyDetails.alarmCode && (
                                    <div className="text-sm">
                                        <span className="text-gray-500">Alarm:</span>
                                        <span className="ml-2 font-mono bg-yellow-100 px-2 py-0.5 rounded text-red-700 font-bold">
                                            {propertyDetails.alarmCode}
                                        </span>
                                    </div>
                                )}
                                {propertyDetails.gateCode && (
                                    <div className="text-sm">
                                        <span className="text-gray-500">Gate:</span>
                                        <span className="ml-2 font-mono bg-gray-100 px-2 py-0.5 rounded font-medium">
                                            {propertyDetails.gateCode}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Parking & Pets */}
                    {(propertyDetails.parkingInstructions || propertyDetails.petInfo) && (
                        <div className="bg-white rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-blue-700 mb-2">🏠 Household</h4>
                            {propertyDetails.parkingInstructions && (
                                <p className="text-sm text-gray-600 mb-1">
                                    🅿️ {propertyDetails.parkingInstructions}
                                </p>
                            )}
                            {propertyDetails.petInfo && (
                                <p className="text-sm text-gray-600">
                                    🐕 {propertyDetails.petInfo}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Preferences & Avoid */}
                    {(propertyDetails.clientPreferences || propertyDetails.areasToAvoid) && (
                        <div className="bg-white rounded-lg p-3">
                            <h4 className="text-sm font-semibold text-purple-700 mb-2">⚠️ Important Notes</h4>
                            {propertyDetails.clientPreferences && (
                                <p className="text-sm text-gray-600 mb-1">
                                    ✨ {propertyDetails.clientPreferences}
                                </p>
                            )}
                            {propertyDetails.areasToAvoid && (
                                <p className="text-sm text-orange-600">
                                    🚫 Avoid: {propertyDetails.areasToAvoid}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PropertyInfoDisplay;
