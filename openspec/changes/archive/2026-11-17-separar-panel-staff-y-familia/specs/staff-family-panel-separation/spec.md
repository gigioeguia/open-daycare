# Spec Delta

## Purpose

Define el comportamiento de separación de la aplicación en dos áreas autenticadas por rol: un área de gestión compartida por admin y staff (`/staff/*`) y un área de familia para el rol parent (`/family/*`), con redirecciones desde las rutas actuales y del post-login según el rol del usuario autenticado.

## ADDED Requirements

### Requirement: Áreas de rol con rutas explícitas
The system SHALL expose two distinct authenticated areas: /staff/* for the admin and staff roles, and /family/* for the parent role.

#### Scenario: Admin accesses staff landing
- **WHEN** an authenticated user with role admin navigates to /staff
- **THEN** the system renders the staff landing page without redirecting

#### Scenario: Staff user accesses staff landing
- **WHEN** an authenticated user with role staff navigates to /staff
- **THEN** the system renders the staff landing page without redirecting

#### Scenario: Parent accesses family landing
- **WHEN** an authenticated user with role parent navigates to /family
- **THEN** the system renders the family landing page without redirecting

### Requirement: Compartimento de área de staff/admin
The system SHALL let admin and staff share the same /staff area, without a separate admin area.

#### Scenario: Admin navigates through staff navigation
- **WHEN** an authenticated user with role admin is in /staff
- **THEN** the system shows the same navigation items as staff (Feed, Niños, Avisos, Cuenta)

### Requirement: Redirección desde rutas actuales al área del rol
The system SHALL redirect unauthenticated-protected access from / and /kids to the landing of the authenticated user's role area (/staff or /family).

#### Scenario: Root redirects staff to staff area
- **WHEN** an authenticated user with role staff navigates to /
- **THEN** the system redirects to /staff

#### Scenario: Root redirects parent to family area
- **WHEN** an authenticated user with role parent navigates to /
- **THEN** the system redirects to /family

#### Scenario: Kids redirects staff to staff area
- **WHEN** an authenticated user with role staff navigates to /kids
- **THEN** the system redirects to /staff/kids

#### Scenario: Kids redirects parent to family area
- **WHEN** an authenticated user with role parent navigates to /kids
- **THEN** the system redirects to /family (without exposing kids management)

### Requirement: Redirección post-login al área del rol
The system SHALL redirect to the landing of the user's role area after a successful login, always (/staff for admin/staff, /family for parent).

#### Scenario: Login redirects staff to staff area
- **WHEN** an authenticated user with role staff completes login successfully
- **THEN** the system redirects to /staff

#### Scenario: Login redirects parent to family area
- **WHEN** an authenticated user with role parent completes login successfully
- **THEN** the system redirects to /family

### Requirement: Bloqueo de acceso cruzado entre áreas
The system SHALL redirect a user to their own role area when they attempt to navigate to an area they are not authorized for.

#### Scenario: Parent accessing staff area is redirected to family
- **WHEN** an authenticated user with role parent navigates to any /staff/* path
- **THEN** the system redirects to /family

#### Scenario: Staff accessing family area is redirected to staff
- **WHEN** an authenticated user with role staff or admin navigates to any /family/* path
- **THEN** the system redirects to /staff

### Requirement: Familia accede solo a datos de hijos vinculados
The system SHALL let a parent view only the feed and the data of their linked children, never the full children list or general kids management.

#### Scenario: Parent family feed shows only linked children
- **WHEN** an authenticated user with role parent navigates to the family feed
- **THEN** the system shows only posts of their linked children and announcements of their children's rooms

#### Scenario: Parent cannot list all children
- **WHEN** an authenticated user with role parent navigates to a kids listing path
- **THEN** the system does not render a general list of all daycare children
