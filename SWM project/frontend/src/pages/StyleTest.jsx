const StyleTest = () => {
  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-light text-gray-900 mb-2">Style Test Page</h1>
        <p className="text-sm text-gray-400 uppercase tracking-wider mb-12">
          Testing Tailwind CSS Classes
        </p>

        {/* Color Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Color Palette Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-gray-900 rounded-xl text-white">
              <p className="text-sm">Gray 900</p>
            </div>
            <div className="p-6 bg-red-400 rounded-xl text-white">
              <p className="text-sm">Red 400</p>
            </div>
            <div className="p-6 bg-amber-400 rounded-xl text-white">
              <p className="text-sm">Amber 400</p>
            </div>
            <div className="p-6 bg-blue-400 rounded-xl text-white">
              <p className="text-sm">Blue 400</p>
            </div>
          </div>
        </section>

        {/* Card Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Card Styles Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stat Card Style */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-200">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl opacity-80">🗑️</span>
                  <div className="h-2 w-2 rounded-full bg-gray-900"></div>
                </div>
                <div>
                  <p className="text-4xl font-light text-gray-900 mb-1">42</p>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Total Bins
                  </p>
                  <p className="text-xs text-gray-400 mt-2">38 operational</p>
                </div>
              </div>
            </div>

            {/* Alert Card Style */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-200">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl opacity-80">⚠️</span>
                  <div className="h-2 w-2 rounded-full bg-red-400"></div>
                </div>
                <div>
                  <p className="text-4xl font-light text-gray-900 mb-1">5</p>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Alerts
                  </p>
                  <p className="text-xs text-gray-400 mt-2">3 segregation, 2 maintenance</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Button Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Button Styles Test</h2>
          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-gray-900 border border-gray-900 rounded-full hover:bg-gray-900 hover:text-white transition-all duration-200">
              Primary Button
            </button>
            <button className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-full hover:border-gray-900 hover:text-gray-900 transition-all duration-200">
              Secondary Button
            </button>
            <button className="px-5 py-2.5 text-sm font-medium text-gray-500 border border-gray-200 rounded-full hover:border-gray-300 hover:text-gray-700 transition-all duration-200">
              Tertiary Button
            </button>
          </div>
        </section>

        {/* Typography Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Typography Test</h2>
          <div className="space-y-4">
            <p className="text-4xl font-light text-gray-900">
              Heading 1 - Font Light
            </p>
            <p className="text-3xl font-light text-gray-900">
              Heading 2 - Font Light
            </p>
            <p className="text-2xl font-light text-gray-900">
              Heading 3 - Font Light
            </p>
            <p className="text-sm text-gray-400 uppercase tracking-wider">
              Label - Uppercase with tracking
            </p>
            <p className="text-base text-gray-600">
              Body text - Regular weight
            </p>
            <p className="text-xs text-gray-400">
              Small text - Extra small size
            </p>
          </div>
        </section>

        {/* Progress Bar Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Progress Bar Test</h2>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">85% Full</span>
                <span className="text-2xl font-light text-gray-900">85%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-red-400 transition-all duration-500" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">70% Full</span>
                <span className="text-2xl font-light text-gray-900">70%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-500" style={{ width: '70%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 uppercase tracking-wider">45% Full</span>
                <span className="text-2xl font-light text-gray-900">45%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div className="h-1.5 rounded-full bg-gray-300 transition-all duration-500" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* Animation Tests */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Animation Test</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Live Indicator</span>
            </div>
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-gray-900"></div>
          </div>
        </section>

        {/* Status Indicator Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Status Indicators Test</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-green-400 text-green-700">
              <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
              <span className="text-xs font-medium uppercase tracking-wide">OK</span>
            </div>
            <div className="flex items-center gap-2 border-amber-400 text-amber-700">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400"></div>
              <span className="text-xs font-medium uppercase tracking-wide">Segregation Required</span>
            </div>
            <div className="flex items-center gap-2 border-red-400 text-red-700">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
              <span className="text-xs font-medium uppercase tracking-wide">Maintenance Needed</span>
            </div>
          </div>
        </section>

        {/* Full Bin Card Test */}
        <section className="mb-12">
          <h2 className="text-2xl font-light text-gray-900 mb-6">Complete Bin Card Test</h2>
          <div className="max-w-sm">
            <div className="bg-white border border-gray-100 rounded-xl p-5 cursor-pointer hover:shadow-xl hover:border-gray-200 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-light text-gray-900 mb-1">BIN-001</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Biodegradable</p>
                </div>
                <div className="text-2xl opacity-70 group-hover:scale-110 transition-transform duration-300">
                  🍃
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 uppercase tracking-wider">Fill Level</span>
                  <span className="text-2xl font-light text-gray-900">78%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-amber-400 transition-all duration-500" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Status</span>
                <div className="flex items-center gap-2 text-green-700">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                  <span className="text-xs font-medium uppercase tracking-wide">OK</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Last seen</span>
                  <span>2m ago</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Result */}
        <section className="border-t border-gray-100 pt-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <p className="text-sm text-green-800 font-medium mb-2">✅ Style Test Complete</p>
            <p className="text-xs text-green-600">
              If you can see all the styles, colors, animations, and hover effects above, 
              your Tailwind CSS configuration is working correctly!
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StyleTest;
