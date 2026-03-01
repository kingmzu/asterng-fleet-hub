# Frontend Integration Guide

## 📋 Overview

The React frontend has been fully integrated with the PHP backend API using:
- **Axios** for HTTP requests
- **React Query (TanStack Query)** for server state management
- **Custom hooks** for each API resource

All files are ready to use. No additional setup needed beyond configuration.

---

## 🚀 Quick Start (5 minutes)

### 1. Configuration

File: `.env.local` (already created)

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ASTERNG Fleet Hub
VITE_APP_ENV=development
```

### 2. Start Backend Server
```bash
# In backend directory
cd asterng-fleet-hub-backend/public
php -S localhost:8000
```

### 3. Start Frontend Server
```bash
# In frontend directory
npm run dev
```

### 4. Test Login
- Navigate to http://localhost:8080
- Email: `admin@asterng.com`
- Password: `password123`

---

## 📁 Created Files

### API Client
- **`src/api/client.ts`** - Configured Axios instance with:
  - Base URL from environment
  - JWT token auto-injection
  - 401 redirect on auth failure
  - Request/response interceptors

### React Query Hooks
- **`src/hooks/api/useAuth.ts`** - Authentication
  - `useLogin()` - Login & save token
  - `useLogout()` - Logout & clear token
  - `useCurrentUser()` - Get logged-in user
  - `isAuthenticated()` - Check auth status

- **`src/hooks/api/useRiders.ts`** - Rider operations
  - `useRiders()` - List with pagination/filter
  - `useRider()` - Get single rider
  - `useCreateRider()` - Create new rider
  - `useUpdateRider()` - Update rider
  - `useDeleteRider()` - Delete rider
  - `useUpdateRiderStatus()` - Change status
  - `useOutstandingRiders()` - Get riders with balance
  - `useSearchRiders()` - Search riders

- **`src/hooks/api/useMotorcycles.ts`** - Motorcycle operations
  - `useMotorcycles()` - List with pagination
  - `useMotorcycle()` - Get single motorcycle
  - `useCreateMotorcycle()` - Register new bike
  - `useUpdateMotorcycle()` - Update bike info
  - `useDeleteMotorcycle()` - Delete bike
  - `useAssignRider()` - Assign rider to bike
  - `useUpdateMaintenance()` - Record maintenance
  - `useMaintenanceAlerts()` - Get maintenance alerts
  - `useInsuranceAlerts()` - Get insurance expiry alerts

- **`src/hooks/api/useRemittances.ts`** - Payment tracking
  - `useRemittances()` - List payments with filters
  - `useRemittance()` - Get single payment
  - `useCreateRemittance()` - Log new payment
  - `useUpdateRemittanceStatus()` - Update payment status
  - `useRemittancesByRider()` - Get rider's payments
  - `useRemittanceStats()` - Get statistics
  - `useOverdueRemittances()` - Get overdue list
  - `useExportRemittances()` - Export as CSV

- **`src/hooks/api/useExpenses.ts`** - Expense tracking
  - `useExpenses()` - List expenses with filters
  - `useExpense()` - Get single expense
  - `useCreateExpense()` - Add new expense
  - `useUpdateExpense()` - Update expense
  - `useDeleteExpense()` - Delete expense
  - `useExpensesByCategory()` - Filter by category
  - `useExpenseStats()` - Get statistics
  - `useExpenseBreakdown()` - Get breakdown by category
  - `useExportExpenses()` - Export as CSV

- **`src/hooks/api/useDashboard.ts`** - Dashboard data
  - `useDashboardStats()` - Overall statistics
  - `useRevenueTrends()` - Monthly trends
  - `useComplianceOverview()` - Compliance data
  - `useCollectionRate()` - Collection statistics

### Exports
- **`src/hooks/api/index.ts`** - Barrel export for all hooks

---

## 💡 Usage Examples

### Example 1: Login & Redirect

```typescript
import { useLogin } from '@/hooks/api';
import { useNavigate } from 'react-router-dom';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();

  const handleLogin = (email: string, password: string) => {
    login(
      { email, password },
      {
        onSuccess: () => {
          navigate('/');
        },
        onError: (error) => {
          console.error('Login failed:', error);
        },
      }
    );
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = e.currentTarget.email.value;
      const password = e.currentTarget.password.value;
      handleLogin(email, password);
    }}>
      {/* form fields */}
      <button disabled={isPending}>
        {isPending ? 'Logging in...' : 'Login'}
      </button>
      {error && <p>{error.message}</p>}
    </form>
  );
};
```

### Example 2: Display Riders List

```typescript
import { useRiders } from '@/hooks/api';
import { Skeleton } from '@/components/ui/skeleton';

export const RidersPage = () => {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useRiders(page, 20, status, search);

  if (isLoading) return <Skeleton className="h-96" />;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1>Riders</h1>
      <input
        placeholder="Search..."
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      <select onChange={(e) => {
        setStatus(e.target.value);
        setPage(1);
      }}>
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
      </select>

      <table>
        <tbody>
          {data?.data.map((rider) => (
            <tr key={rider.id}>
              <td>{rider.name}</td>
              <td>{rider.phone}</td>
              <td>{rider.status}</td>
              <td>{rider.complianceScore}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        {Array.from({ length: data?.pagination.pages || 0 }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setPage(i + 1)}
            disabled={page === i + 1}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};
```

### Example 3: Create Rider

```typescript
import { useCreateRider } from '@/hooks/api';
import { useForm } from 'react-hook-form';

export const CreateRiderForm = () => {
  const { register, handleSubmit } = useForm();
  const { mutate: createRider, isPending } = useCreateRider();

  const onSubmit = (data) => {
    createRider(data, {
      onSuccess: () => {
        alert('Rider created successfully!');
        // Refetch list or redirect
      },
      onError: (error) => {
        alert(`Error: ${error.message}`);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: true })} placeholder="Name" />
      <input {...register('phone', { required: true })} placeholder="Phone" />
      <input {...register('email')} placeholder="Email" />
      <input {...register('joinDate', { required: true })} type="date" />

      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Rider'}
      </button>
    </form>
  );
};
```

### Example 4: Dashboard with Multiple Queries

```typescript
import {
  useDashboardStats,
  useRevenueTrends,
  useComplianceOverview,
} from '@/hooks/api';

export const Dashboard = () => {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: trends, isLoading: trendsLoading } = useRevenueTrends(6);
  const { data: compliance, isLoading: complianceLoading } =
    useComplianceOverview();

  if (statsLoading || trendsLoading || complianceLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div class="grid grid-cols-4 gap-4">
        <StatCard
          title="Total Bikes"
          value={stats?.totalBikes}
        />
        <StatCard
          title="Active Riders"
          value={stats?.activeRiders}
        />
        <StatCard
          title="Monthly Revenue"
          value={`₦${stats?.monthlyRevenue}`}
        />
        <StatCard
          title="Monthly Expenses"
          value={`₦${stats?.monthlyExpenses}`}
        />
      </div>

      <Chart data={trends} />

      <ComplianceStats data={compliance} />
    </div>
  );
};
```

### Example 5: Export Data

```typescript
import { useExportRemittances } from '@/hooks/api';

export const ExportButton = () => {
  const { mutate: export Remittances } = useExportRemittances();

  const handleExport = () => {
    exportRemittances(
      {
        format: 'csv',
        from: '2024-01-01',
        to: '2024-01-31',
      },
      {
        onSuccess: (data) => {
          // data is blob
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'remittances.csv';
          a.click();
        },
      }
    );
  };

  return <button onClick={handleExport}>Export as CSV</button>;
};
```

---

## 🔄 Data Synchronization

### Auto-Invalidation on Mutations

The hooks automatically refetch related data after mutations:

```typescript
// Creating rider will auto-refetch riders list
const { mutate: createRider } = useCreateRider();

// Creating payment will auto-refetch:
// - Remittances list
// - Dashboard stats
// - Rider's outstanding balance
const { mutate: createRemittance } = useCreateRemittance();
```

### Manual Refetch

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Refetch specific query
queryClient.invalidateQueries({ queryKey: ['riders'] });

// Refetch all rider queries
queryClient.invalidateQueries({ queryKey: ['riders'] });

// Refetch everything
queryClient.invalidateQueries();
```

---

## 🛡️ Error Handling

### Built-in Error Handling

The API client automatically:
- Clears token on 401 (Unauthorized)
- Redirects to login on auth failure
- Logs server errors

### Handle Errors in Hooks

```typescript
const { mutate, error, isError } = useCreateRider();

if (isError) {
  console.error('Error:', error);
}
```

---

## ⏱️ Caching & Stale Time

Configured stale times (how long data is considered fresh):

| Resource | Stale Time |
|----------|-----------|
| Riders | 1 minute |
| Motorcycles | 1 minute |
| Remittances | 1 minute |
| Expenses | 1 minute |
| Dashboard Stats | 2 minutes |
| Trends | 5 minutes |
| Stats | 2 minutes |

Adjust in hook definitions if needed.

---

## 🔐 Authentication Flow

1. User logs in via `useLogin()`
2. Token saved to `localStorage`
3. Axios adds token to all requests automatically
4. On 401 response, token cleared & redirected to login

### Check if Authenticated

```typescript
import { isAuthenticated } from '@/hooks/api/useAuth';

if (isAuthenticated()) {
  // Show protected content
}
```

### Get Current User

```typescript
const { data: user } = useCurrentUser();

if (user) {
  console.log(`Logged in as: ${user.name}`);
}
```

---

## 📝 Updating Page Components

Replace mock data imports with API hooks:

### Before
```typescript
import { mockRiders } from '@/lib/mockData';

const riders = mockRiders;
```

### After
```typescript
import { useRiders } from '@/hooks/api';

const { data, isLoading } = useRiders();
const riders = data?.data || [];
```

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@asterng.com","password":"password123"}'
```

### Test Protected Endpoint
```bash
curl -X GET http://localhost:8000/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

---

## 📊 API Endpoints Summary

See `BACKEND_SPECIFICATION.md` in backend folder for complete API docs.

---

## 🆘 Troubleshooting

### CORS Error
- Verify backend CORS config
- Check `VITE_API_BASE_URL` matches backend
- Backend should be running on `localhost:8000`

### 401 Unauthorized
- Token missing or expired
- Re-login required
- Check localStorage has 'authToken'

### 404 Not Found
- Verify endpoint path in API
- Check request method (GET, POST, etc)
- Backend routes may have changed

### Connection Refused
- Backend PHP server not running
- Check: `php -S localhost:8000` in public folder
- Verify port 8000 is not in use

---

## ✅ What's Ready

✅ API client configured
✅ 40+ custom hooks created
✅ Authentication setup
✅ Error handling
✅ Auto-pagination
✅ Search & filtering
✅ Data exports
✅ Caching optimized

---

## 🚀 Next Steps

1. Replace `mockData` imports with hooks
2. Update page components to use real data
3. Add loading states with Skeleton
4. Add error toasts with Sonner
5. Test end-to-end

---

**Status**: ✅ **Ready to integrate!**

The frontend is fully prepared. Just:
1. Ensure backend is running
2. Update page components
3. Test queries in browser DevTools

Happy coding! 🎉
