// Simple test to verify dashboard components
console.log('Testing Dashboard Components...');

// Test if the dashboard service can be imported
try {
  const { dashboardService } = require('./lib/dashboard-service.ts');
  console.log('✅ Dashboard service imported successfully');
} catch (error) {
  console.log('❌ Failed to import dashboard service:', error.message);
}

// Test if the components can be imported
try {
  const { DashboardOverview } = require('./components/dashboard/dashboard-overview.tsx');
  console.log('✅ Dashboard overview component imported successfully');
} catch (error) {
  console.log('❌ Failed to import dashboard overview component:', error.message);
}

try {
  const { AssessmentWidget } = require('./components/dashboard/widgets/assessment-widget.tsx');
  console.log('✅ Assessment widget component imported successfully');
} catch (error) {
  console.log('❌ Failed to import assessment widget component:', error.message);
}

try {
  const { IndicatorWidget } = require('./components/dashboard/widgets/indicator-widget.tsx');
  console.log('✅ Indicator widget component imported successfully');
} catch (error) {
  console.log('❌ Failed to import indicator widget component:', error.message);
}

console.log('Dashboard component test completed!'); 