# Multi-Store POS System - Process Flowcharts

This document contains detailed flowcharts for all major processes in the Multi-Store POS System.

**Last Updated:** November 10, 2025

---

## Table of Contents
1. [User Registration Flow](#1-user-registration-flow)
2. [Guest Login Flow](#2-guest-login-flow)
3. [User Login Flow](#3-user-login-flow)
4. [Store Creation Flow](#4-store-creation-flow)
5. [Store Switching Flow](#5-store-switching-flow)
6. [Staff Management Flow](#6-staff-management-flow)
7. [Product Management Flow](#7-product-management-flow)
8. [POS Transaction Flow](#8-pos-transaction-flow)
9. [Role-Based Access Control Flow](#9-role-based-access-control-flow)
10. [Complete System Architecture](#10-complete-system-architecture)

---

## 1. User Registration Flow

### Registered User Registration (Store Creation Optional)

```mermaid
graph TD
    Start([User Opens App]) --> Landing[Landing Page]
    Landing --> RegChoice{Choose Login Type}
    
    RegChoice -->|Register| RegStart[Click 'Register']
    RegChoice -->|Login| LoginFlow[Go to Login Flow]
    RegChoice -->|Guest| GuestFlow[Go to Guest Flow]
    
    RegStart --> EnterMobile[Enter Mobile Number]
    EnterMobile --> ValidateMobile{Valid Mobile?}
    ValidateMobile -->|No| ErrorMobile[Show Error]
    ErrorMobile --> EnterMobile
    
    ValidateMobile -->|Yes| SendOTP[Backend: Send OTP]
    SendOTP --> SaveOTP[(Save OTP in DB<br/>Expires in 5 min)]
    SaveOTP --> ShowOTPInput[Show OTP Input Screen]
    
    ShowOTPInput --> EnterOTP[User Enters OTP]
    EnterOTP --> VerifyOTP{OTP Correct?}
    VerifyOTP -->|No| WrongOTP[Show Error]
    WrongOTP --> RetryOTP{Retry Count < 3?}
    RetryOTP -->|Yes| EnterOTP
    RetryOTP -->|No| ResendOTP[Resend OTP Option]
    ResendOTP --> SendOTP
    
    VerifyOTP -->|Yes| MarkVerified[Mark OTP as Verified]
    MarkVerified --> EnterPIN[Enter 6-Digit PIN]
    EnterPIN --> ConfirmPIN[Confirm PIN]
    ConfirmPIN --> PINMatch{PINs Match?}
    PINMatch -->|No| EnterPIN
    
    PINMatch -->|Yes| CreateUser[Create User Record:<br/>- ID: UUID<br/>- Mobile: xxx-xxx-xxxx<br/>- PIN Hash: bcrypt<br/>- Type: REGISTERED]
    
    CreateUser --> AskStore{Create Store Now?}
    
    AskStore -->|Skip for Now| GenToken1[Generate JWT Token]
    GenToken1 --> SaveToken1[Save Token]
    SaveToken1 --> SetContextNoStore[Set App Context:<br/>- User<br/>- No Stores<br/>- No Role]
    SetContextNoStore --> NavEmpty[Navigate to Empty Home]
    NavEmpty --> ShowEmptyState[Show Empty State:<br/>- Create Store option<br/>- Wait for invitation]
    ShowEmptyState --> End1([Registration Complete<br/>No Store Access])
    
    AskStore -->|Yes, Create Store| EnterStoreName[Enter Store Name]
    EnterStoreName --> ValidateStore{Store Name Valid?}
    ValidateStore -->|No| StoreError[Show Error:<br/>Min 3 characters]
    StoreError --> EnterStoreName
    
    ValidateStore -->|Yes| BeginTx[Begin Database Transaction]
    
    BeginTx --> CreateStore[Create Store Record:<br/>- ID: UUID<br/>- Name: Store Name<br/>- Owner ID: User ID<br/>- Active: true]
    
    CreateStore --> AssignOwner[Create UserStoreRole:<br/>- User ID<br/>- Store ID<br/>- Role: OWNER<br/>- Assigned At: now]
    
    AssignOwner --> CommitTx{Transaction Success?}
    CommitTx -->|No| Rollback[Rollback Store Creation]
    Rollback --> ShowError[Show Error Message]
    ShowError --> AskStore
    
    CommitTx -->|Yes| GenToken2[Generate JWT Token:<br/>- User ID<br/>- User Type<br/>- Exp: 24h]
    
    GenToken2 --> SaveToken2[Save Token:<br/>- LocalStorage or<br/>- SessionStorage]
    
    SaveToken2 --> SetContext[Set App Context:<br/>- User<br/>- Current Store<br/>- User Stores<br/>- Role: OWNER]
    
    SetContext --> NavPOS[Navigate to POS]
    NavPOS --> End2([Registration Complete<br/>With Store Access])
    
    style Start fill:#e1f5e1
    style End1 fill:#fff3cd
    style End2 fill:#d4edda
    style CommitTx fill:#fff3cd
    style CreateUser fill:#d1ecf1
    style CreateStore fill:#d1ecf1
    style AssignOwner fill:#d1ecf1
    style GenToken2 fill:#d4edda
    style NavPOS fill:#d4edda
    style ShowEmptyState fill:#fff3cd
    style AskStore fill:#cfe2ff
```

**Key Steps:**
1. User enters mobile number
2. System sends OTP via SMS
3. User verifies OTP (3 attempts max)
4. User creates 6-digit PIN and confirms
5. **System creates user account** (REGISTERED type)
6. **Optional Store Creation:**
   - **If user chooses "Skip":**
     - User logged in without store
     - Redirected to empty home page
     - Shows options: Create Store or Wait for Invitation
     - User has no role until joining/creating a store
   - **If user chooses "Create Store":**
     - User enters Store Name
     - System creates store record
     - UserStoreRole created (OWNER role)
     - User redirected to POS with full access
7. JWT token generated and stored in both paths
```

**Key Steps:**
1. User enters mobile number
2. System sends OTP via SMS
3. User verifies OTP (3 attempts max)
4. User creates 6-digit PIN
5. User enters Store Name (required)
6. System creates:
   - User account (REGISTERED type)
   - Store record (user as owner)
   - UserStoreRole (OWNER role)
7. JWT token generated and stored
8. User redirected to POS with full access

---

## 2. Guest Login Flow

### Guest User Login (No Registration Required)

```mermaid
graph TD
    Start([User Opens App]) --> Landing[Landing Page]
    Landing --> GuestClick[Click 'Continue as Guest']
    
    GuestClick --> Confirm{Confirm Guest Mode?}
    Confirm -->|Cancel| Landing
    
    Confirm -->|Yes| ShowWarning[Show Warning:<br/>- Data not saved<br/>- Session only<br/>- Limited features]
    
    ShowWarning --> Accept{User Accepts?}
    Accept -->|No| Landing
    
    Accept -->|Yes| EnterStoreName[Enter Store Name<br/>for Guest Store]
    
    EnterStoreName --> ValidateStore{Valid Name?}
    ValidateStore -->|No| ErrorName[Show Error]
    ErrorName --> EnterStoreName
    
    ValidateStore -->|Yes| BeginTx[Begin Transaction]
    
    BeginTx --> GenSession[Generate Session Token:<br/>Random UUID]
    
    GenSession --> CreateGuest[Create User Record:<br/>- ID: UUID<br/>- Mobile: NULL<br/>- PIN: NULL<br/>- Type: GUEST<br/>- Session Token]
    
    CreateGuest --> CreateStore[Create Store Record:<br/>- Name: Store Name<br/>- Owner ID: Guest User<br/>- Active: true]
    
    CreateStore --> AssignOwner[Create UserStoreRole:<br/>- Role: OWNER<br/>- User: Guest User]
    
    AssignOwner --> CommitTx{Success?}
    CommitTx -->|No| Rollback[Rollback]
    Rollback --> Error[Show Error]
    Error --> EnterStoreName
    
    CommitTx -->|Yes| GenToken[Generate JWT:<br/>- User ID<br/>- Type: GUEST<br/>- Session Token]
    
    GenToken --> SaveSession[Save in SessionStorage<br/>NOT LocalStorage]
    
    SaveSession --> SetContext[Set App Context:<br/>- Guest User<br/>- Guest Store<br/>- Role: OWNER<br/>- isGuest: true]
    
    SetContext --> ShowLimits[Display Guest Limitations:<br/>- No staff management<br/>- No multi-store access<br/>- Session-based only]
    
    ShowLimits --> NavPOS[Navigate to POS]
    NavPOS --> End([Guest Session Active])
    
    End --> OnLogout[On Logout/Close]
    OnLogout --> DeleteGuest[Delete Guest User<br/>& Store Data]
    DeleteGuest --> SessionEnd([Session Ended])
    
    style Start fill:#e1f5e1
    style End fill:#ffe5cc
    style SessionEnd fill:#f8d7da
    style ShowWarning fill:#fff3cd
    style ShowLimits fill:#fff3cd
    style CreateGuest fill:#d1ecf1
    style CreateStore fill:#d1ecf1
    style SaveSession fill:#ffe5cc
```

**Key Points:**
- **No mobile number or PIN required**
- **Session-based authentication** (cleared on logout)
- **Temporary user and store** created
- **Cannot be assigned to other stores**
- **Data deleted when session ends**
- **Limited to managing own store only**

---

## 3. User Login Flow

### Existing Registered User Login

```mermaid
graph TD
    Start([User Opens App]) --> CheckAuth{Already<br/>Authenticated?}
    
    CheckAuth -->|Yes| ValidToken{Token Valid?}
    ValidToken -->|Yes| LoadUser[Load User Data]
    LoadUser --> AutoLogin[Auto-Login]
    AutoLogin --> CheckStores
    
    ValidToken -->|No| ClearToken[Clear Invalid Token]
    ClearToken --> LoginPage
    
    CheckAuth -->|No| LoginPage[Show Login Page]
    
    LoginPage --> EnterMobile[Enter Mobile Number]
    EnterMobile --> EnterPIN[Enter PIN]
    EnterPIN --> Submit[Submit Login]
    
    Submit --> ValidateCreds[Backend: Validate Credentials]
    ValidateCreds --> CheckUser{User Exists?}
    
    CheckUser -->|No| Error1[Error: User not found]
    Error1 --> LoginPage
    
    CheckUser -->|Yes| CheckPIN{PIN Correct?}
    CheckPIN -->|No| Error2[Error: Invalid PIN]
    Error2 --> RetryCount{Attempts < 3?}
    RetryCount -->|Yes| EnterPIN
    RetryCount -->|No| LockAccount[Lock Account 15min]
    LockAccount --> LoginPage
    
    CheckPIN -->|Yes| GetStores[Query User Stores:<br/>SELECT * FROM user_store_roles<br/>WHERE user_id = X AND is_active = true]
    
    GetStores --> CountStores{How Many Stores?}
    
    CountStores -->|0| NoStores[No Store Access]
    NoStores --> GenToken1[Generate JWT Token]
    GenToken1 --> SaveToken1[Save Token]
    SaveToken1 --> SetEmptyContext[Set App Context:<br/>- User<br/>- No Stores<br/>- No Role]
    SetEmptyContext --> NavEmpty[Navigate to Empty Home]
    NavEmpty --> ShowEmptyState[Show Empty State:<br/>1. Create Store Button<br/>2. Waiting for Invitation]
    ShowEmptyState --> End1([Login Success<br/>No Store Access])
    
    CountStores -->|1| AutoSelect[Auto-Select Single Store]
    AutoSelect --> LoadStore
    
    CountStores -->|2+| ShowSelector[Show Store Selector Modal]
    ShowSelector --> UserSelect[User Selects Store]
    UserSelect --> LoadStore[Load Selected Store:<br/>- Products<br/>- Settings<br/>- Role]
    
    LoadStore --> GenToken2[Generate JWT Token]
    GenToken2 --> Remember{Remember Me?}
    
    Remember -->|Yes| SaveLocal[Save to LocalStorage]
    Remember -->|No| SaveSession[Save to SessionStorage]
    
    SaveLocal --> SetContext
    SaveSession --> SetContext[Set App Context:<br/>- User<br/>- Current Store<br/>- User Stores<br/>- Role]
    
    SetContext --> POSPage[Navigate to POS]
    POSPage --> End2([Login Success<br/>With Store Access])
    
    CheckStores{Has Stores?}
    CheckStores -->|No| NavEmpty
    CheckStores -->|Yes| CountStores
    
    style Start fill:#e1f5e1
    style End1 fill:#fff3cd
    style End2 fill:#d4edda
    style CheckUser fill:#fff3cd
    style CheckPIN fill:#fff3cd
    style CountStores fill:#d1ecf1
    style ShowSelector fill:#cfe2ff
    style ShowEmptyState fill:#fff3cd
    style NoStores fill:#fff3cd
```

**Multi-Store Handling:**
- **0 stores:** Empty home page with create/wait options
- **1 store:** Auto-select and redirect to POS
- **2+ stores:** Show selector, then redirect to selected store's POS

---

## 4. Store Creation Flow

### Creating a New Store (Registered Users Only)

```mermaid
graph TD
    Start([User Clicks 'Create Store']) --> CheckAuth{User Type?}
    
    CheckAuth -->|GUEST| BlockGuest[Show Error:<br/>'Guest users cannot<br/>create multiple stores']
    BlockGuest --> End1([Action Blocked])
    
    CheckAuth -->|REGISTERED| ShowForm[Show Create Store Form]
    
    ShowForm --> EnterName[Enter Store Name]
    EnterName --> EnterDesc[Enter Description<br/>Optional]
    EnterDesc --> SubmitForm[Submit Form]
    
    SubmitForm --> Validate{Valid Input?}
    Validate -->|No| ShowErrors[Show Validation Errors]
    ShowErrors --> EnterName
    
    Validate -->|Yes| BeginTx[Begin Transaction]
    
    BeginTx --> CreateStore[Create Store:<br/>- Name<br/>- Owner ID: Current User<br/>- Description]
    
    CreateStore --> AssignOwner[Create UserStoreRole:<br/>- User ID<br/>- Store ID<br/>- Role: OWNER<br/>- Assigned By: Self]
    
    AssignOwner --> CreateDefaults[Create Default Settings:<br/>- Categories<br/>- Payment Methods]
    
    CreateDefaults --> CommitTx{Success?}
    CommitTx -->|No| Rollback[Rollback]
    Rollback --> ErrorMsg[Show Error]
    ErrorMsg --> ShowForm
    
    CommitTx -->|Yes| RefreshStores[Refresh User Stores List]
    RefreshStores --> ShowSuccess[Show Success Toast]
    
    ShowSuccess --> AutoSwitch{Auto-Switch<br/>to New Store?}
    AutoSwitch -->|Yes| SwitchContext[Set as Current Store]
    SwitchContext --> ReloadProducts[Load Products<br/>Empty initially]
    
    AutoSwitch -->|No| StayCurrentStore[Stay on Current Store]
    
    ReloadProducts --> End2([Store Created])
    StayCurrentStore --> End2
    
    style Start fill:#e1f5e1
    style End1 fill:#f8d7da
    style End2 fill:#d4edda
    style BlockGuest fill:#f8d7da
    style CommitTx fill:#fff3cd
    style CreateStore fill:#d1ecf1
    style AssignOwner fill:#d1ecf1
```

**Restrictions:**
- **Guest users blocked** from creating multiple stores
- **Registered users** can create unlimited stores
- **Store creator** automatically becomes Owner
- **Auto-switch option** to new store after creation

---

## 5. Store Switching Flow

### Switching Between User's Stores

```mermaid
graph TD
    Start([User in POS Page]) --> ClickSelector[Click Store Selector<br/>in Header]
    
    ClickSelector --> ShowDropdown[Show Store Dropdown:<br/>List All Accessible Stores]
    
    ShowDropdown --> DisplayStores[For Each Store Display:<br/>- Store Name<br/>- User Role<br/>- Active Indicator]
    
    DisplayStores --> UserSelect[User Selects Store]
    
    UserSelect --> SameStore{Same as Current?}
    SameStore -->|Yes| CloseDropdown[Close Dropdown]
    CloseDropdown --> NoChange([No Change])
    
    SameStore -->|No| ConfirmSwitch{Cart Has Items?}
    
    ConfirmSwitch -->|Yes| ShowWarning[Show Warning:<br/>'Cart will be cleared']
    ShowWarning --> UserConfirm{Confirm?}
    UserConfirm -->|No| CloseDropdown
    
    UserConfirm -->|Yes| ClearCart[Clear Current Cart]
    ConfirmSwitch -->|No| ClearCart
    
    ClearCart --> BeginSwitch[Begin Store Switch]
    
    BeginSwitch --> UpdateContext[Update App Context:<br/>- Current Store ID<br/>- Store Name]
    
    UpdateContext --> FetchStore[Fetch Store Details:<br/>GET /api/stores/:id]
    
    FetchStore --> FetchRole[Get User Role in Store:<br/>FROM user_store_roles]
    
    FetchRole --> SetPermissions[Calculate Permissions:<br/>Based on Role]
    
    SetPermissions --> FetchProducts[Fetch Store Products:<br/>GET /api/stores/:id/products]
    
    FetchProducts --> UpdateUI[Update UI:<br/>- Store Name in Header<br/>- Products Grid<br/>- Empty Cart<br/>- Role Badge]
    
    UpdateUI --> ShowSuccess[Show Toast:<br/>'Switched to Store X']
    
    ShowSuccess --> CheckRole{User Role?}
    
    CheckRole -->|OWNER/ADMIN| ShowManagement[Show Management Buttons:<br/>- Manage Products<br/>- Manage Staff]
    
    CheckRole -->|MANAGER| ShowProductMgmt[Show Product Management<br/>Hide Staff Management]
    
    CheckRole -->|STAFF| HideManagement[Hide All Management<br/>Show POS Only]
    
    ShowManagement --> End([Switch Complete])
    ShowProductMgmt --> End
    HideManagement --> End
    
    style Start fill:#e1f5e1
    style End fill:#d4edda
    style NoChange fill:#e2e3e5
    style ConfirmSwitch fill:#fff3cd
    style ShowWarning fill:#fff3cd
    style CheckRole fill:#d1ecf1
    style UpdateContext fill:#cfe2ff
```

**Important:**
- **Cart is cleared** when switching stores
- **Permissions recalculated** based on role in new store
- **UI updates** to reflect role-based access
- **Products reloaded** from new store

---

## 6. Staff Management Flow

### Adding, Editing, and Removing Staff

```mermaid
graph TD
    Start([Owner/Admin Navigates<br/>to Staff Management]) --> CheckPerm{Has Permission?}
    
    CheckPerm -->|No STAFF role| AccessDenied[Show Error:<br/>Access Denied]
    AccessDenied --> End1([Blocked])
    
    CheckPerm -->|MANAGER| AccessDenied
    
    CheckPerm -->|OWNER/ADMIN| LoadStaff[Load Staff List:<br/>GET /api/stores/:id/staff]
    
    LoadStaff --> DisplayList[Display Staff Table:<br/>- Name Mobile<br/>- Role<br/>- Assigned Date<br/>- Actions]
    
    DisplayList --> Action{User Action?}
    
    %% ADD STAFF FLOW %%
    Action -->|Add Staff| ShowAddForm[Show Add Staff Modal]
    ShowAddForm --> EnterMobile[Enter Staff Mobile Number]
    EnterMobile --> SearchUser[Search User in DB:<br/>SELECT * FROM users<br/>WHERE mobile = X]
    
    SearchUser --> UserExists{User Found?}
    
    UserExists -->|No| ShowInvite[Show Message:<br/>'User not registered<br/>Send invitation?']
    ShowInvite --> SendInvite[Send SMS Invitation<br/>with Registration Link]
    SendInvite --> DisplayList
    
    UserExists -->|Yes| CheckGuest{User Type?}
    CheckGuest -->|GUEST| BlockGuest[Error: Cannot add<br/>guest users as staff]
    BlockGuest --> ShowAddForm
    
    CheckGuest -->|REGISTERED| CheckExisting{Already a Member?}
    CheckExisting -->|Yes| ErrorExists[Error: User already<br/>a staff member]
    ErrorExists --> ShowAddForm
    
    CheckExisting -->|No| SelectRole[Select Role:<br/>- Admin<br/>- Manager<br/>- Staff]
    SelectRole --> ValidateRole{Valid Role?}
    ValidateRole -->|No| ErrorRole[Cannot assign OWNER role]
    ErrorRole --> SelectRole
    
    ValidateRole -->|Yes| CreateRole[Create UserStoreRole:<br/>- User ID<br/>- Store ID<br/>- Role<br/>- Assigned By: Current User]
    
    CreateRole --> SaveRole[(Save to DB)]
    SaveRole --> NotifyUser[Send SMS Notification:<br/>'Added to Store X']
    NotifyUser --> RefreshList1[Refresh Staff List]
    RefreshList1 --> ShowSuccess1[Success Toast]
    ShowSuccess1 --> DisplayList
    
    %% EDIT ROLE FLOW %%
    Action -->|Edit Role| SelectStaff1[Select Staff Member]
    SelectStaff1 --> CheckOwner1{Is Owner?}
    CheckOwner1 -->|Yes| ErrorOwner1[Cannot change<br/>owner role]
    ErrorOwner1 --> DisplayList
    
    CheckOwner1 -->|No| ShowRoleForm[Show Change Role Modal]
    ShowRoleForm --> SelectNewRole[Select New Role]
    SelectNewRole --> ConfirmChange{Confirm Change?}
    ConfirmChange -->|No| DisplayList
    
    ConfirmChange -->|Yes| UpdateRole[Update UserStoreRole:<br/>SET role = X]
    UpdateRole --> LogChange[Log Role Change:<br/>in Audit Trail]
    LogChange --> NotifyUser2[Notify User of Change]
    NotifyUser2 --> RefreshList2[Refresh Staff List]
    RefreshList2 --> ShowSuccess2[Success Toast]
    ShowSuccess2 --> DisplayList
    
    %% REMOVE STAFF FLOW %%
    Action -->|Remove Staff| SelectStaff2[Select Staff Member]
    SelectStaff2 --> CheckOwner2{Is Owner?}
    CheckOwner2 -->|Yes| ErrorOwner2[Cannot remove owner]
    ErrorOwner2 --> DisplayList
    
    CheckOwner2 -->|No| ConfirmRemove[Confirm Removal:<br/>'Remove user access?']
    ConfirmRemove --> UserConfirm{Confirmed?}
    UserConfirm -->|No| DisplayList
    
    UserConfirm -->|Yes| DeactivateRole[Update UserStoreRole:<br/>SET is_active = false]
    DeactivateRole --> LogRemoval[Log Removal in Audit]
    LogRemoval --> NotifyUser3[Notify User:<br/>'Removed from Store X']
    NotifyUser3 --> RefreshList3[Refresh Staff List]
    RefreshList3 --> ShowSuccess3[Success Toast]
    ShowSuccess3 --> DisplayList
    
    DisplayList --> End2([Staff Management Active])
    
    style Start fill:#e1f5e1
    style End1 fill:#f8d7da
    style End2 fill:#d4edda
    style AccessDenied fill:#f8d7da
    style BlockGuest fill:#f8d7da
    style CheckPerm fill:#fff3cd
    style CheckGuest fill:#fff3cd
    style CheckOwner1 fill:#fff3cd
    style CheckOwner2 fill:#fff3cd
```

**Key Permissions:**
- **Owner/Admin**: Can add, edit, remove staff
- **Manager**: No staff management access
- **Staff**: No staff management access
- **Guest users**: Cannot be added as staff
- **Owner role**: Cannot be changed or removed

---

## 7. Product Management Flow

### Adding, Editing, and Deleting Products

```mermaid
graph TD
    Start([User on POS/Products Page]) --> Action{User Action?}
    
    %% ADD PRODUCT FLOW %%
    Action -->|Add Product| CheckAddPerm{Has Add Permission?}
    CheckAddPerm -->|No| DenyAdd[Access Denied]
    DenyAdd --> End1([Blocked])
    
    CheckAddPerm -->|All Roles| ShowAddForm[Show Add Product Form]
    ShowAddForm --> FillForm[Enter Product Details:<br/>- Name Required<br/>- Price Required<br/>- Stock Required<br/>- Category Optional<br/>- Image Optional]
    
    FillForm --> ValidateAdd{Valid Data?}
    ValidateAdd -->|No| ShowErrors1[Show Validation Errors]
    ShowErrors1 --> FillForm
    
    ValidateAdd -->|Yes| CompressImage{Has Image?}
    CompressImage -->|Yes| Compress[Compress Image<br/>to Base64]
    Compress --> CreateProduct
    CompressImage -->|No| CreateProduct[Create Product:<br/>POST /api/stores/:id/products]
    
    CreateProduct --> SaveProduct[(Save Product<br/>& ProductImage)]
    SaveProduct --> RefreshList1[Refresh Product List]
    RefreshList1 --> ShowSuccess1[Success Toast:<br/>'Product Added']
    ShowSuccess1 --> BackToPOS1[Return to POS]
    BackToPOS1 --> End2
    
    %% EDIT PRODUCT FLOW %%
    Action -->|Edit Product| CheckEditPerm{Has Edit Permission?}
    CheckEditPerm -->|STAFF| DenyEdit[Access Denied:<br/>Staff cannot edit]
    DenyEdit --> End1
    
    CheckEditPerm -->|OWNER/ADMIN/MANAGER| SelectProduct1[Select Product to Edit]
    SelectProduct1 --> LoadProduct[Load Product Details:<br/>GET /api/stores/:id/products/:pid]
    
    LoadProduct --> ShowEditForm[Show Edit Form<br/>Pre-filled with Data]
    ShowEditForm --> ModifyFields[Modify Fields]
    ModifyFields --> ValidateEdit{Valid Changes?}
    ValidateEdit -->|No| ShowErrors2[Show Errors]
    ShowErrors2 --> ModifyFields
    
    ValidateEdit -->|Yes| UpdateProduct[Update Product:<br/>PUT /api/stores/:id/products/:pid]
    UpdateProduct --> SaveChanges[(Save to DB)]
    SaveChanges --> RefreshList2[Refresh List]
    RefreshList2 --> ShowSuccess2[Success Toast:<br/>'Product Updated']
    ShowSuccess2 --> BackToPOS2[Return to POS]
    BackToPOS2 --> End2
    
    %% DELETE PRODUCT FLOW %%
    Action -->|Delete Product| CheckDelPerm{Has Delete Permission?}
    CheckDelPerm -->|STAFF| DenyDelete[Access Denied:<br/>Staff cannot delete]
    DenyDelete --> End1
    
    CheckDelPerm -->|OWNER/ADMIN/MANAGER| SelectProduct2[Select Product to Delete]
    SelectProduct2 --> ConfirmDelete[Confirm Deletion Dialog]
    ConfirmDelete --> UserConfirm{Confirmed?}
    UserConfirm -->|No| BackToPOS3[Cancel]
    BackToPOS3 --> End2
    
    UserConfirm -->|Yes| DeleteProduct[DELETE /api/stores/:id/products/:pid]
    DeleteProduct --> RemoveDB[(Remove from DB:<br/>CASCADE to ProductImage)]
    RemoveDB --> RefreshList3[Refresh List]
    RefreshList3 --> ShowSuccess3[Success Toast:<br/>'Product Deleted']
    ShowSuccess3 --> OfferUndo[Show Undo Option<br/>5 seconds]
    OfferUndo --> UndoAction{User Clicks Undo?}
    UndoAction -->|Yes| RestoreProduct[Restore Product]
    RestoreProduct --> RefreshList4[Refresh List]
    RefreshList4 --> End2
    UndoAction -->|No| End2([Product Management Complete])
    
    style Start fill:#e1f5e1
    style End1 fill:#f8d7da
    style End2 fill:#d4edda
    style DenyAdd fill:#f8d7da
    style DenyEdit fill:#f8d7da
    style DenyDelete fill:#f8d7da
    style CheckAddPerm fill:#d1ecf1
    style CheckEditPerm fill:#d1ecf1
    style CheckDelPerm fill:#d1ecf1
    style ConfirmDelete fill:#fff3cd
```

**Permission Matrix:**
| Action | Owner | Admin | Manager | Staff |
|--------|-------|-------|---------|-------|
| Add    | ✅    | ✅    | ✅      | ✅    |
| Edit   | ✅    | ✅    | ✅      | ❌    |
| Delete | ✅    | ✅    | ✅      | ❌    |

---

## 8. POS Transaction Flow

### Processing a Sale

```mermaid
graph TD
    Start([User on POS Page]) --> BrowseProducts[Browse Products<br/>Filter by Category/Search]
    
    BrowseProducts --> SelectProduct[Click Product Tile]
    SelectProduct --> CheckStock{Stock > 0?}
    
    CheckStock -->|No| ShowOOS[Show 'Out of Stock' Overlay]
    ShowOOS --> BrowseProducts
    
    CheckStock -->|Yes| AddToCart[Add to Cart:<br/>Quantity = 1]
    
    AddToCart --> UpdateCart[Update Cart State:<br/>- Product ID<br/>- Quantity<br/>- Price<br/>- Subtotal]
    
    UpdateCart --> ShowBadge[Update Cart Badge:<br/>Bounce Animation<br/>Show Count]
    
    ShowBadge --> ContinueShopping{Continue Shopping?}
    ContinueShopping -->|Yes| BrowseProducts
    
    ContinueShopping -->|No| OpenCart[Click Cart Icon]
    OpenCart --> ShowCart[Show Cart Modal:<br/>- Items List<br/>- Quantities<br/>- Subtotals<br/>- Total Amount]
    
    ShowCart --> CartAction{User Action?}
    
    CartAction -->|Adjust Qty| ChangeQty[Change Quantity]
    ChangeQty --> RecalcTotal[Recalculate Totals]
    RecalcTotal --> ShowCart
    
    CartAction -->|Remove Item| RemoveItem[Remove from Cart]
    RemoveItem --> RecalcTotal
    
    CartAction -->|Clear Cart| ClearAll[Clear All Items]
    ClearAll --> ConfirmClear{Confirm?}
    ConfirmClear -->|Yes| EmptyCart[Empty Cart]
    EmptyCart --> ShowCart
    ConfirmClear -->|No| ShowCart
    
    CartAction -->|Checkout| ValidateCart{Cart Not Empty?}
    ValidateCart -->|Empty| ErrorEmpty[Cannot checkout<br/>empty cart]
    ErrorEmpty --> ShowCart
    
    ValidateCart -->|Has Items| ShowPayment[Show Payment Page:<br/>- Order Summary<br/>- Total Amount<br/>- Payment Method]
    
    ShowPayment --> SelectPayment[Select Payment Method:<br/>- Cash<br/>- Card<br/>- Digital Wallet]
    
    SelectPayment --> EnterAmount{Payment Method?}
    
    EnterAmount -->|Cash| EnterCash[Enter Amount Received]
    EnterCash --> CalcChange[Calculate Change]
    CalcChange --> ProcessPayment
    
    EnterAmount -->|Card/Wallet| ProcessPayment[Process Payment]
    
    ProcessPayment --> CreateTransaction[Create Transaction:<br/>POST /api/stores/:id/transactions]
    
    CreateTransaction --> SaveTx[Save Transaction:<br/>- Store ID<br/>- User ID<br/>- Total Amount<br/>- Payment Method<br/>- Timestamp]
    
    SaveTx --> SaveItems[Save Transaction Items:<br/>- Product ID<br/>- Quantity<br/>- Unit Price<br/>- Subtotal]
    
    SaveItems --> UpdateStock[Batch Update Stock:<br/>POST /api/stores/:id/products/stock/batch<br/>Reduce quantities]
    
    UpdateStock --> StockSuccess{Update Success?}
    
    StockSuccess -->|No| RollbackTx[Rollback Transaction]
    RollbackTx --> ShowError[Show Error:<br/>'Insufficient stock']
    ShowError --> ShowCart
    
    StockSuccess -->|Yes| CommitAll[Commit All Changes]
    CommitAll --> ClearCart[Clear Cart]
    ClearCart --> RefreshProducts[Refresh Product List<br/>with Updated Stock]
    
    RefreshProducts --> ShowReceipt[Show Receipt Modal:<br/>- Transaction ID<br/>- Items<br/>- Total<br/>- Payment Method<br/>- Change if Cash]
    
    ShowReceipt --> ReceiptAction{User Action?}
    
    ReceiptAction -->|Print| PrintReceipt[Print Receipt]
    PrintReceipt --> CloseReceipt
    
    ReceiptAction -->|Email| EmailReceipt[Email Receipt]
    EmailReceipt --> CloseReceipt
    
    ReceiptAction -->|Close| CloseReceipt[Close Receipt Modal]
    CloseReceipt --> ShowSuccess[Success Toast:<br/>'Sale Complete']
    
    ShowSuccess --> End([Return to POS])
    
    style Start fill:#e1f5e1
    style End fill:#d4edda
    style CheckStock fill:#fff3cd
    style ValidateCart fill:#fff3cd
    style StockSuccess fill:#fff3cd
    style CreateTransaction fill:#d1ecf1
    style UpdateStock fill:#d1ecf1
    style CommitAll fill:#d4edda
```

**Transaction Processing:**
1. User selects products and adds to cart
2. Reviews cart and adjusts quantities
3. Proceeds to checkout
4. Selects payment method
5. System creates transaction record
6. System updates product stock (batch operation)
7. Transaction committed if stock update succeeds
8. Receipt displayed with print/email options
9. Cart cleared and user returns to POS

---

## 9. Role-Based Access Control Flow

### Permission Check Process

```mermaid
graph TD
    Start([User Attempts Action]) --> GetContext[Get User Context:<br/>- User ID<br/>- Current Store ID<br/>- User Type]
    
    GetContext --> CheckAuth{Authenticated?}
    CheckAuth -->|No| Redirect[Redirect to Login]
    Redirect --> End1([Access Denied])
    
    CheckAuth -->|Yes| CheckGuest{User Type?}
    
    CheckGuest -->|GUEST| CheckGuestAction{Action Type?}
    CheckGuestAction -->|Multi-Store Feature| BlockGuest[Block: Guest cannot<br/>access multi-store features]
    BlockGuest --> End1
    
    CheckGuestAction -->|Staff Management| BlockGuest
    CheckGuestAction -->|Own Store POS| AllowGuest[Allow: Guest can<br/>manage own store]
    AllowGuest --> End2
    
    CheckGuest -->|REGISTERED| QueryRole[Query UserStoreRole:<br/>SELECT role FROM user_store_roles<br/>WHERE user_id = X<br/>AND store_id = Y<br/>AND is_active = true]
    
    QueryRole --> HasRole{Role Found?}
    HasRole -->|No| NoAccess[Error: User not a member<br/>of this store]
    NoAccess --> End1
    
    HasRole -->|Yes| GetRole[Extract Role:<br/>OWNER, ADMIN,<br/>MANAGER, or STAFF]
    
    GetRole --> CheckAction{Action Required?}
    
    %% PRODUCT ACTIONS %%
    CheckAction -->|View Products| AllowAll[All Roles: ✅]
    AllowAll --> End2([Access Granted])
    
    CheckAction -->|Add Product| AllowAll
    
    CheckAction -->|Edit Product| CheckEdit{Role Level?}
    CheckEdit -->|STAFF| DenyEdit[Deny: Staff cannot edit]
    DenyEdit --> End1
    CheckEdit -->|MANAGER+| AllowEdit[Allow: Manager+ can edit]
    AllowEdit --> End2
    
    CheckAction -->|Delete Product| CheckDelete{Role Level?}
    CheckDelete -->|STAFF| DenyDelete[Deny: Staff cannot delete]
    DenyDelete --> End1
    CheckDelete -->|MANAGER+| AllowDelete[Allow: Manager+ can delete]
    AllowDelete --> End2
    
    %% STAFF MANAGEMENT %%
    CheckAction -->|View Staff| CheckViewStaff{Role Level?}
    CheckViewStaff -->|OWNER/ADMIN| AllowViewStaff[Allow]
    AllowViewStaff --> End2
    CheckViewStaff -->|MANAGER/STAFF| DenyViewStaff[Deny]
    DenyViewStaff --> End1
    
    CheckAction -->|Add Staff| CheckAddStaff{Role Level?}
    CheckAddStaff -->|OWNER/ADMIN| AllowAddStaff[Allow]
    AllowAddStaff --> End2
    CheckAddStaff -->|MANAGER/STAFF| DenyAddStaff[Deny]
    DenyAddStaff --> End1
    
    CheckAction -->|Remove Staff| CheckRemoveStaff{Role Level?}
    CheckRemoveStaff -->|OWNER/ADMIN| AllowRemoveStaff[Allow]
    AllowRemoveStaff --> End2
    CheckRemoveStaff -->|MANAGER/STAFF| DenyRemoveStaff[Deny]
    DenyRemoveStaff --> End1
    
    %% STORE MANAGEMENT %%
    CheckAction -->|Edit Store| CheckEditStore{Role Level?}
    CheckEditStore -->|OWNER/ADMIN| AllowEditStore[Allow]
    AllowEditStore --> End2
    CheckEditStore -->|MANAGER/STAFF| DenyEditStore[Deny]
    DenyEditStore --> End1
    
    CheckAction -->|Delete Store| CheckDeleteStore{Role Level?}
    CheckDeleteStore -->|OWNER| AllowDeleteStore[Allow: Owner only]
    AllowDeleteStore --> End2
    CheckDeleteStore -->|ADMIN/MANAGER/STAFF| DenyDeleteStore[Deny: Owner only]
    DenyDeleteStore --> End1
    
    %% POS OPERATIONS %%
    CheckAction -->|Process Sale| AllowAll
    CheckAction -->|View Transactions| CheckViewTx{Role Level?}
    CheckViewTx -->|STAFF| DenyViewTx[Deny: Staff cannot<br/>view all transactions]
    DenyViewTx --> End1
    CheckViewTx -->|MANAGER+| AllowViewTx[Allow]
    AllowViewTx --> End2
    
    style Start fill:#e1f5e1
    style End1 fill:#f8d7da
    style End2 fill:#d4edda
    style CheckAuth fill:#fff3cd
    style CheckGuest fill:#fff3cd
    style HasRole fill:#fff3cd
    style AllowAll fill:#d4edda
    style BlockGuest fill:#f8d7da
```

**Permission Hierarchy:**
```
OWNER (Level 4)
  ├─ Full administrative rights
  ├─ Can manage all staff
  ├─ Can delete store
  └─ All permissions below

ADMIN (Level 3)
  ├─ Full administrative rights
  ├─ Can manage staff (except owner)
  ├─ Cannot delete store
  └─ All permissions below

MANAGER (Level 2)
  ├─ Can manage products (CRUD)
  ├─ Can process sales
  ├─ Can view reports
  ├─ Cannot manage staff
  └─ Cannot edit store settings

STAFF (Level 1)
  ├─ Can process sales
  ├─ Can add products
  ├─ Cannot edit products
  ├─ Cannot delete products
  └─ No management access
```

---

## 10. Complete System Architecture

### High-Level System Flow

```mermaid
graph TB
    subgraph Client["Frontend React App"]
        UI[User Interface]
        Auth[Auth Context]
        Store[Store Context]
        Cart[Cart Context]
        API[API Service Layer]
    end
    
    subgraph Backend["Go Backend API"]
        Router[Gorilla Mux Router]
        AuthMW[Auth Middleware]
        RoleMW[RBAC Middleware]
        
        subgraph Handlers
            AuthH[Auth Handler]
            StoreH[Store Handler]
            ProductH[Product Handler]
            TxH[Transaction Handler]
        end
        
        subgraph Services
            JWTSvc[JWT Service]
            OTPSvc[OTP Service]
            PermSvc[Permission Service]
        end
    end
    
    subgraph Database["PostgreSQL Database"]
        Users[(Users Table)]
        Stores[(Stores Table)]
        USR[(UserStoreRoles<br/>Join Table)]
        Products[(Products Table)]
        ProdImg[(ProductImages Table)]
        Tx[(Transactions Table)]
        TxItems[(TransactionItems Table)]
    end
    
    subgraph External["External Services"]
        SMS[SMS Service<br/>OTP Delivery]
        Storage[Supabase<br/>Database Hosting]
    end
    
    UI -->|User Actions| Auth
    UI -->|User Actions| Store
    UI -->|User Actions| Cart
    
    Auth -->|API Calls| API
    Store -->|API Calls| API
    Cart -->|API Calls| API
    
    API -->|HTTP Requests| Router
    
    Router --> AuthMW
    AuthMW -->|Validate JWT| JWTSvc
    AuthMW --> RoleMW
    RoleMW -->|Check Permissions| PermSvc
    
    RoleMW --> AuthH
    RoleMW --> StoreH
    RoleMW --> ProductH
    RoleMW --> TxH
    
    AuthH -->|Send OTP| OTPSvc
    OTPSvc -->|SMS| SMS
    
    AuthH -->|CRUD| Users
    StoreH -->|CRUD| Stores
    StoreH -->|CRUD| USR
    ProductH -->|CRUD| Products
    ProductH -->|CRUD| ProdImg
    TxH -->|CRUD| Tx
    TxH -->|CRUD| TxItems
    
    Users -.->|FK| Stores
    Users -.->|FK| USR
    Stores -.->|FK| USR
    Stores -.->|FK| Products
    Stores -.->|FK| Tx
    Products -.->|FK| ProdImg
    Tx -.->|FK| TxItems
    
    Users -->|Hosted on| Storage
    Stores -->|Hosted on| Storage
    USR -->|Hosted on| Storage
    Products -->|Hosted on| Storage
    ProdImg -->|Hosted on| Storage
    Tx -->|Hosted on| Storage
    TxItems -->|Hosted on| Storage
    
    style Client fill:#e1f5e1
    style Backend fill:#cfe2ff
    style Database fill:#fff3cd
    style External fill:#f8d7da
    style UI fill:#d4edda
    style Router fill:#d1ecf1
    style AuthMW fill:#ffeaa7
    style RoleMW fill:#ffeaa7
```

---

## Summary

This flowchart documentation covers all major processes in the Multi-Store POS System:

1. **User Registration** - Mobile-based registration with store creation
2. **Guest Login** - Temporary access without registration
3. **User Login** - Multi-store authentication
4. **Store Creation** - Creating additional stores (registered users only)
5. **Store Switching** - Switching between accessible stores
6. **Staff Management** - Adding, editing, removing staff members
7. **Product Management** - CRUD operations with role-based permissions
8. **POS Transactions** - Complete sale processing workflow
9. **RBAC** - Role-based access control logic
10. **System Architecture** - Complete system overview

**Key Features:**
- Multi-store support with role-based access
- Guest users for quick access (limited features)
- Comprehensive permission system
- Mobile-first design
- Real-time cart management
- Transaction integrity with rollback support

Last Updated: November 10, 2025
