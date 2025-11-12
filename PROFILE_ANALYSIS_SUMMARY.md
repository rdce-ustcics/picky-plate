# Profile Page Components Analysis - Summary

## Key Findings

### 1. Main Profile Component
- **File**: `C:\React\pappy2\picky-plate\src\pages\Profile.js` (372 lines)
- **Purpose**: Manage user profile (name, phone, email) and food preferences
- **Data**: Loads/saves preferences from/to backend API
- **Issue**: Profile data (name, phone) stored in localStorage, not database

### 2. Preferences Modal
- **Location**: Embedded in `Dashboard.js` (not extracted as component)
- **Type**: 4-step onboarding wizard
- **Steps**: Cuisines → Dislikes → Diets → Allergens
- **Issue**: Not reusable - hardcoded in Dashboard only

### 3. Preference Options (Hardcoded)
- Cuisines: 8 options (Filipino, Japanese, Italian, Korean, Chinese, American, Thai, Mexican)
- Dislikes: 8 options (Seafood, Spicy, Vegetables, Meat, Dairy, Gluten, Nuts, Eggs)
- Allergens: 8 options (Peanuts, Tree-nuts, Eggs, Dairy, Gluten, Soy, Fish, Shellfish)
- Diets: 8 options (Omnivore, Vegetarian, Vegan, Pescetarian, Keto, Low-carb, Halal, Kosher)
- Favorites: 8 options (non-functional)
- **Issue**: Duplicated in Profile.js and Dashboard.js

### 4. Kiddie Meal Feature
- **Status**: MISSING/NOT IMPLEMENTED
- **Missing from**: Onboarding wizard, Profile page, Backend models, API
- **Critical**: Appears to be a required feature based on project context

### 5. Backend Structure
- **Preference Models**: Separate collections (LikePref, DislikePref, DietPref, AllergenPref)
- **No Profile Model**: User name/phone only in localStorage
- **No Favorites Model**: Backend returns empty favorites array
- **No Kiddie Meal Storage**: No place to store kiddie meal preference

### 6. Current Data Flow
```
Profile.js
  ↓
GET /api/preferences/me (x-user-id header)
  ↓
Loads: likes, dislikes, diets, allergens (favorites always empty)
  ↓
User edits preferences
  ↓
PUT /api/preferences/me
  ↓
Backend saves to MongoDB
```

## What Needs to Be Fixed

### CRITICAL FIXES
1. **Add Kiddie Meal Feature**
   - Create backend model
   - Add to onboarding wizard
   - Add to Profile page
   - Create API endpoints

2. **Persist Profile Data to Backend**
   - Move name/phone from localStorage to database
   - Create User profile model or extend User
   - Create API endpoints: GET/PUT /api/profile/me

3. **Extract Reusable Modal**
   - Move preferences modal from Dashboard to separate component
   - Make accessible from Profile page

### IMPORTANT FIXES
4. Implement avatar upload functionality
5. Implement password change functionality
6. Implement favorites (create model, add to UI)
7. Improve error handling

### CODE QUALITY
8. Centralize preference options in `src/constants/preferences.js`
9. Unify label/emoji display system
10. Add TypeScript or PropTypes

## File Locations

### Frontend
- Main component: `C:\React\pappy2\picky-plate\src\pages\Profile.js`
- Styling: `C:\React\pappy2\picky-plate\src\pages\Profile.css`
- Onboarding: `C:\React\pappy2\picky-plate\src\pages\Dashboard.js` (lines 268-500)

### Backend
- API routes: `C:\React\pappy2\picky-plate\server\routes\preferences.js`
- Models: `C:\React\pappy2\picky-plate\server\models\prefs.js`
- User model: `C:\React\pappy2\picky-plate\server\models\User.js`

## Architecture Issues

1. **Preference Options Hardcoded in Multiple Places**
   - Profile.js: lines 42-47 and 50-61
   - Dashboard.js: lines 154-196
   - Should be centralized in constants file

2. **Modal Not Reusable**
   - Users can't easily edit preferences after onboarding
   - Modal only appears on first login
   - Should extract to separate component

3. **Profile Data Storage Split**
   - Preferences → MongoDB
   - Name/phone → localStorage
   - Should all be in database

4. **No Type Safety**
   - No TypeScript or PropTypes
   - No validation of preference structure

## Recommendation

Start with fixing the most critical issues:
1. Add Kiddie Meal feature (appears required)
2. Move profile data to backend
3. Extract and reuse preferences modal
4. Then add missing features (avatar, password change, favorites)

This will ensure data consistency and allow for future feature expansion.
