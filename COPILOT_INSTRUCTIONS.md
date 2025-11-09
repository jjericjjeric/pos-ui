# GitHub Copilot Instructions Guide

## Project Context
This is a **Point of Sale (POS) System** built with:
- **Frontend**: React + Vite, TailwindCSS
- **Backend**: Go (Golang) API
- **Architecture**: RESTful API with JWT authentication
- **Deployment**: Netlify (both frontend and backend)

---

## Core Principles

### 1. **Design Philosophy: Google Material Design (HIGHEST PRIORITY)**
- **Overall aesthetic**: Simple, elegant, clean
- **Visual approach**: Minimalist with purposeful use of space
- **Design inspiration**: Google's Material Design principles
  - Clean whitespace and breathing room
  - Subtle shadows and depth
  - Smooth, meaningful animations
  - Clear visual hierarchy
  - Purposeful color usage (not overdone)

**Key Design Elements:**
- ✅ Generous padding and margins
- ✅ Soft shadows for depth (avoid harsh borders)
- ✅ Rounded corners (8px-16px)
- ✅ Gradient accents (subtle, not overwhelming)
- ✅ Clear typography hierarchy
- ✅ Minimal color palette with strategic pops
- ✅ Smooth transitions (200-400ms)
- ✅ Floating action buttons where appropriate
- ✅ Card-based layouts
- ✅ Clean iconography

**Visual Simplicity Checklist:**
- [ ] Remove unnecessary elements
- [ ] Use whitespace intentionally
- [ ] Keep color palette minimal (2-3 main colors)
- [ ] Ensure consistent spacing throughout
- [ ] Add subtle depth with shadows, not borders
- [ ] Use icons to reduce visual clutter

### 2. **Mobile-First Design**
- **ALWAYS** design for mobile screens first (320px - 640px)
- Use responsive breakpoints in this order:
  - Base styles: Mobile (default)
  - `sm:` - Tablets (640px+)
  - `md:` - Small laptops (768px+)
  - `lg:` - Desktops (1024px+)
  - `xl:` - Large screens (1280px+)

**Example Pattern:**
```jsx
// ✅ CORRECT - Mobile first
<div className="text-sm sm:text-base md:text-lg lg:text-xl">

// ❌ WRONG - Desktop first
<div className="text-xl lg:text-lg md:text-base sm:text-sm">
```

**Mobile-First Checklist:**
- [ ] Touch-friendly tap targets (minimum 44x44px)
- [ ] Readable text without zooming (minimum 16px base)
- [ ] Simplified navigation for small screens
- [ ] Stack layouts vertically on mobile
- [ ] Use hamburger menus when appropriate
- [ ] Test with viewport width 375px (iPhone)
- [ ] Maintain Google-like simplicity on all screen sizes

---

### 3. **Recommendation Framework**

When implementing features or solving problems:

**ALWAYS provide 3 alternatives with detailed analysis:**

```markdown
## Approach Options

### Option 1: [Name]
**Description:** Brief explanation

**Pros:**
- ✅ Advantage 1
- ✅ Advantage 2
- ✅ Advantage 3

**Cons:**
- ❌ Disadvantage 1
- ❌ Disadvantage 2

**Best for:** Use case scenario
**Complexity:** Low/Medium/High

---

### Option 2: [Name]
[Same structure...]

---

### Option 3: [Name]
[Same structure...]

---

## Recommended: Option X
**Reasoning:** Why this is the best choice for this specific case
```

**When to offer alternatives:**
- New feature implementation
- Performance optimization
- Architecture decisions
- State management choices
- Styling approaches
- API integration patterns

---

### 4. **Verification Protocol**

**BEFORE completing any task, run this checklist:**

#### A. Code Changes Verification
```bash
# 1. Check for compilation errors
- Run: get_errors tool on all modified files
- Verify: No breaking errors (linting warnings OK)

# 2. Validate file integrity
- Confirm: All imports are correct
- Confirm: All props are passed correctly
- Confirm: All hooks dependencies are listed

# 3. Cross-reference changes
- Check: Related files for needed updates
- Check: Context providers for new methods
- Check: Routes for new pages
```

#### B. Mobile Responsiveness Check
```markdown
For EVERY UI change, verify:
- [ ] Mobile (375px): Layout works, text readable
- [ ] Tablet (768px): Proper scaling
- [ ] Desktop (1024px+): Optimal layout
- [ ] Touch targets: At least 44x44px
- [ ] No horizontal scroll on mobile
- [ ] Google-like simplicity maintained
- [ ] Clean whitespace and breathing room
```

#### C. Design Consistency Check
```markdown
For EVERY visual change, verify:
- [ ] Follows Google Material Design principles
- [ ] Simple and elegant (no visual clutter)
- [ ] Consistent with existing UI patterns
- [ ] Proper use of shadows (not borders)
- [ ] Rounded corners where appropriate
- [ ] Minimal, purposeful color usage
- [ ] Smooth animations and transitions
```

#### D. Accessibility Check
```markdown
- [ ] Proper semantic HTML
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation support
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
```

#### E. Task Completion Verification
```markdown
After implementation, confirm:
- [ ] All user requirements addressed
- [ ] All edge cases handled
- [ ] Error states implemented
- [ ] Loading states added
- [ ] Success feedback provided
- [ ] Documentation updated if needed
```

---

## 4. **Response Structure**

### Standard Response Format:

```markdown
## Understanding
[Restate the user's request to confirm understanding]

## Analysis
[If applicable, analyze current state and challenges]

## Recommendations
[Present 3 alternatives with pros/cons when appropriate]

## Implementation
[Code changes with clear explanations]

## Verification
[Checklist of what was verified]

## Summary
[Brief summary of changes and next steps]
```

---

## 5. **Technology Stack Guidelines**

### React Best Practices
```jsx
// ✅ Use functional components with hooks
const Component = () => {
  const [state, setState] = useState();
  // ...
}

// ✅ Destructure props
const Component = ({ data, onAction }) => {}

// ✅ Use optional chaining
user?.role

// ✅ Proper dependency arrays
useEffect(() => {
  // effect
}, [dependency]);

// ✅ Use custom hooks for reusable logic
const { toasts, addToast, removeToast } = useToast();
const { values, errors, handleChange, validate } = useFormValidation(initialValues, validationRules);
useClickOutside(ref, () => setOpen(false), isOpen);
```

### Custom Hooks Available
**Location**: `/src/hooks/`

1. **useToast** - Toast notification management
   ```jsx
   const { toasts, addToast, removeToast } = useToast();
   addToast('Success!', 'success');
   addToast('Error occurred', 'error', 3000);
   addToast('Deleted', 'success', 5000, handleUndo, 'Undo');
   ```

2. **useClickOutside** - Detect clicks outside element
   ```jsx
   const menuRef = useRef(null);
   useClickOutside(menuRef, () => setShowMenu(false), showMenu);
   ```

3. **useFormValidation** - Form state and validation
   ```jsx
   const { values, errors, handleChange, handleBlur, validate, setFieldValue } = 
     useFormValidation(
       { name: '', email: '' },
       (values) => {
         const errors = {};
         if (!values.name) errors.name = 'Required';
         return errors;
       }
     );
   ```

4. **useImageCache** - Image caching (already documented)
5. **useImageCompression** - Image compression (already documented)
6. **useLazyLoad** - Lazy loading (already documented)

### Reusable Components Available
**Location**: `/src/components/`

1. **SearchBar** - Search input with clear button
   ```jsx
   <SearchBar
     value={searchQuery}
     onChange={setSearchQuery}
     placeholder="Search..."
     inputRef={searchInputRef}
   />
   ```

2. **CategoryFilter** - Category pills or dropdown
   ```jsx
   <CategoryFilter
     categories={['All', 'Food', 'Drinks']}
     selectedCategory={selected}
     onCategoryChange={setSelected}
     mode="pills" // or "dropdown"
   />
   ```

3. **FormField** - Input with label and error
   ```jsx
   <FormField
     label="Product Name"
     name="name"
     value={values.name}
     onChange={handleChange}
     error={errors.name}
     required
     icon="📦"
     inputProps={{ min: '0' }}
   />
   ```

4. **Toast** / **ToastContainer** - Notifications (already documented)
5. **Modal** - Reusable modal (already documented)
6. **ProgressiveImage** - Lazy image loading (already documented)

### TailwindCSS Patterns
```jsx
// ✅ Mobile-first responsive classes
className="px-4 sm:px-6 md:px-8 lg:px-10"

// ✅ Use project color variables
className="bg-primary text-white"
// Instead of: bg-[#667eea]

// ✅ Consistent spacing scale
className="gap-2 sm:gap-3 md:gap-4"

// ✅ Google Material Design elements
className="rounded-lg shadow-md" // Soft shadows
className="rounded-xl shadow-lg" // Elevated cards
className="transition-all duration-300" // Smooth animations
className="bg-white/90 backdrop-blur-sm" // Subtle transparency

// ✅ Clean, generous spacing
className="p-6 sm:p-8" // Breathing room
className="space-y-4 sm:space-y-6" // Vertical rhythm

// ✅ Subtle gradients (use sparingly)
className="bg-gradient-to-br from-primary to-primary-dark"
```

### State Management
```jsx
// ✅ Use Context for global state
// ✅ Use local state for component-specific data
// ✅ Avoid prop drilling (max 2 levels)
// ✅ Optimistic UI updates for better UX
```

---

## 6. **Common Tasks Workflows**

### Adding a New Feature

1. **Understand Requirements**
   - Clarify scope and constraints
   - Identify affected components

2. **Provide Alternatives**
   - Present 3 implementation approaches
   - Include trade-offs

3. **Plan Implementation**
   - List files to create/modify
   - Define component hierarchy
   - Plan state management

4. **Implement Mobile-First**
   - Start with mobile layout
   - Add responsive breakpoints
   - Test on different screen sizes

5. **Verify Everything**
   - Run error checks
   - Test user flows
   - Confirm all requirements met

### Fixing Bugs

1. **Diagnose**
   - Read error messages carefully
   - Check related files
   - Identify root cause

2. **Propose Solutions**
   - Explain the issue
   - Offer fix alternatives
   - Recommend best approach

3. **Implement Fix**
   - Make minimal changes
   - Add error handling
   - Consider edge cases

4. **Verify Fix**
   - Confirm error resolved
   - Check for regressions
   - Test related functionality

### Refactoring Code

1. **Analyze Current State**
   - Identify code smells
   - Note performance issues
   - List maintainability concerns

2. **Recommend Approaches**
   - Present refactoring options
   - Compare complexity vs. benefit
   - Suggest migration path

3. **Implement Incrementally**
   - Make one change at a time
   - Keep functionality intact
   - Update tests/docs

4. **Verify No Regressions**
   - Test all affected features
   - Check performance metrics
   - Validate error handling

---

## 7. **Quality Standards**

### Code Quality
- ✅ DRY (Don't Repeat Yourself)
- ✅ Single Responsibility Principle
- ✅ Clear, descriptive naming
- ✅ Consistent formatting
- ✅ Proper error handling
- ✅ Loading states for async operations

### UI/UX Quality
- ✅ Consistent spacing and sizing
- ✅ Smooth animations (200-400ms)
- ✅ Clear visual hierarchy
- ✅ Intuitive user flows
- ✅ Helpful error messages
- ✅ Immediate visual feedback
- ✅ Google-like simplicity and elegance
- ✅ Generous whitespace
- ✅ Subtle shadows for depth
- ✅ Minimal, purposeful design choices

### Performance
- ✅ Optimize re-renders
- ✅ Lazy load when beneficial
- ✅ Debounce search inputs
- ✅ Minimize bundle size
- ✅ Efficient API calls

---

## 8. **Project-Specific Patterns**

### Authentication
```jsx
// Always use from context
const { user, isAuthenticated } = useInventory();

// Check permissions
const canManage = user?.role !== 'cashier';
```

### API Calls
```jsx
// Always use try-catch
try {
  const result = await api.someMethod();
  // Optimistic update
  // Show success toast
} catch (error) {
  // Revert optimistic update
  // Show error toast
  throw error;
}
```

### Toast Notifications
```jsx
// Use for user feedback
addToast('Action completed', 'success');
addToast('Error occurred', 'error');
addToast('Information', 'info', 5000); // Custom duration
```

### Modal Patterns
```jsx
// ✅ Use state to control visibility
const [showModal, setShowModal] = useState(false);
const [editingItem, setEditingItem] = useState(null);

// Open modal with data
setEditingItem(item);

// Close and reset
setEditingItem(null);
```

### Click-Outside Detection
```jsx
// ✅ Use useClickOutside hook
const menuRef = useRef(null);
useClickOutside(menuRef, () => setShowMenu(false), showMenu);

// In JSX
<div ref={menuRef}>
  <button onClick={() => setShowMenu(true)}>Menu</button>
  {showMenu && <div>Menu content</div>}
</div>
```

### Form Validation Pattern
```jsx
// ✅ Use useFormValidation hook
const { values, errors, handleChange, handleBlur, validate } = useFormValidation(
  { name: '', price: '', stock: '' },
  (values) => {
    const errors = {};
    if (!values.name.trim()) errors.name = 'Name required';
    if (values.price < 0) errors.price = 'Invalid price';
    return errors;
  }
);

// In submit handler
const handleSubmit = (e) => {
  e.preventDefault();
  if (validate()) {
    // Submit form
  }
};
```

---

## 9. **File Organization**

```
src/
├── components/         # Reusable UI components
│   ├── Modal.jsx
│   ├── Toast.jsx
│   └── ...
├── pages/             # Route components
│   ├── POSPage.jsx
│   ├── LoginPage.jsx
│   └── ...
├── context/           # State management
│   ├── InventoryContext.jsx
│   └── useInventory.js
├── services/          # API integration
│   └── api.js
└── index.css          # Global styles
```

**Component Naming:**
- PascalCase for components: `ProductTile.jsx`
- camelCase for utilities: `useInventory.js`
- kebab-case for styles: `index.css`

---

## 10. **Error Handling Strategy**

### API Errors
```jsx
// ✅ Use toast notifications
const { addToast } = useToast();

catch (error) {
  const message = error.message || 'Something went wrong';
  addToast(message, 'error');
}

// ✅ Handle authentication errors
if (response.status === 401) {
  logout();
  navigate('/');
}
```

### Form Validation
```jsx
// ✅ Use useFormValidation hook
const { values, errors, handleChange, validate } = useFormValidation(
  initialValues,
  validationRules
);

// Automatic error clearing on change
// Manual validation on submit
if (!validate()) return;
```

---

## 11. **Testing Mindset**

Before marking any task complete, mentally test:

1. **Happy Path**: Does it work as intended?
2. **Error States**: What if API fails?
3. **Edge Cases**: Empty data? Null values?
4. **Mobile UX**: Touch-friendly? Readable?
5. **Accessibility**: Keyboard nav? Screen readers?
6. **Performance**: Fast enough? Smooth?

---

## 12. **Communication Guidelines**

### When Responding:
- ✅ Be concise but complete
- ✅ Use clear, simple language
- ✅ Provide code examples
- ✅ Explain "why" not just "what"
- ✅ Highlight trade-offs
- ❌ Don't assume knowledge
- ❌ Don't skip verification steps

### Code Comments:
```jsx
// ✅ Explain complex logic
// ✅ Note gotchas or workarounds
// ✅ Document props for components
// ❌ Don't state the obvious
```

---

## 13. **Quick Reference Checklists**

### New Component Checklist
- [ ] Mobile-first responsive design
- [ ] Google Material Design aesthetic
- [ ] PropTypes or TypeScript types
- [ ] Error boundary handling
- [ ] Loading states
- [ ] Accessibility attributes
- [ ] Reusable and composable
- [ ] Documented props
- [ ] Clean, generous spacing
- [ ] Subtle shadows (not harsh borders)
- [ ] Smooth transitions

### New Page Checklist
- [ ] Route added to App.jsx
- [ ] Authentication guard if needed
- [ ] Mobile navigation
- [ ] Loading state
- [ ] Error state
- [ ] Empty state
- [ ] Proper header/footer

### API Integration Checklist
- [ ] Error handling
- [ ] Loading indicator
- [ ] Success feedback
- [ ] Optimistic updates
- [ ] Network error handling
- [ ] Authentication token
- [ ] Proper HTTP methods

---

## 14. **Final Verification Script**

**Before saying "Done", run this mental checklist:**

```markdown
## Pre-Completion Verification

### Code Quality
- [ ] No console errors
- [ ] No linting errors (warnings OK)
- [ ] All imports resolved
- [ ] All dependencies listed

### Functionality
- [ ] All requirements met
- [ ] Edge cases handled
- [ ] Error states work
- [ ] Loading states work

### Mobile-First
- [ ] Mobile layout perfect
- [ ] Tablet layout good
- [ ] Desktop layout optimal
- [ ] Touch targets sufficient

### User Experience
- [ ] Intuitive flow
- [ ] Clear feedback
- [ ] Fast performance
- [ ] Accessible
- [ ] Simple and elegant (Google-like)
- [ ] Clean visual hierarchy
- [ ] Generous whitespace
```

---

## Remember:

> **"Google-Like Design, Mobile-First, Verify Always, Recommend Options"**

1. **GOOGLE MATERIAL DESIGN** - Simple, elegant, clean aesthetics
2. **MOBILE FIRST** - Every single time
3. **VERIFY THOROUGHLY** - Double-check all changes
4. **OFFER ALTERNATIVES** - Present options with trade-offs
5. **COMPLETE TASKS** - Address every requirement
6. **COMMUNICATE CLEARLY** - Explain reasoning

---

## Updates to This Guide

This guide should be updated when:
- New patterns emerge in the codebase
- Project requirements change
- Better practices are discovered
- Team conventions evolve

Last Updated: November 9, 2025
