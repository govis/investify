# Foundational Mandates

## Company Linking Logic

The company linking process is managed via `scripts/link-companies.js` and supports three distinct modes of operation. Regardless of the mode, all links MUST point to `/company/TICKER.EXCHANGE`.

### 1. Operational Modes

*   **Verify and Cleanup (Mode 1 - Default):**
    *   **Validation:** Removes any hyperlinks that do not have a corresponding `Profile.json` file in the `Companies/TICKER.EXCHANGE` directory.
    *   **Short Files:** Automatically removes all company links from `Short.md` files.
    *   **Double Links:** If both a company name and its ticker are linked in the same instance (e.g., `[Name](/company/ID) ([Ticker](/company/ID))`), the ticker link is removed, keeping only the company name clickable.
*   **Reverse Company Linking (Mode 2):**
    *   Iterates through all folders in the `Companies/` directory and searches for mentions within the relevant thesis Markdown files.
*   **Thesis to Company Linking (Mode 3):**
    *   Iterates through all Markdown files in the `Theses/` directory and searches for applicable company references.

### 2. Matching & Frequency Rules (Modes 2 & 3)

When performing active linking (Modes 2 and 3), the following precision rules MUST be applied:

*   **Thesis Alignment:** A company is only eligible for linking if the thesis (folder name) matches one of its assigned theses in `Profile.json` or `CompanyList.json`.
*   **Naming Priority:** Use `name_clean` from `Profile.json` as the primary match string. Fall back to `CompanyList.json` if `name_clean` is missing.
*   **Precision Matching:**
    *   **Multi-word Names:** Match at least 2 words to avoid generic term collisions.
    *   **Expanded Match:** Terms defined in `config.json` (e.g., "United States") require an expanded match or explicit ticker context to be linked.
    *   **Common Words:** Common words (e.g., "THE", "ON", "IS") must never be linked as stand-alone tickers.
*   **Frequency Logic:**
    *   **Low Frequency (< 5 appearances):** Link only the **first** appearance of the company in the document.
    *   **High Frequency (>= 5 appearances):** Link **ONLY** instances where both the name and ticker are present (e.g., "Nvidia (NVDA)"). Only the name should be clickable.
*   **Ticker Context:** Stand-alone tickers are only linked if they appear in an unambiguous context (e.g., a "Ticker" column or immediately following a name).

### 3. Maintenance

Before applying new links in Modes 2 or 3, any existing `[text](/company/...)` patterns must be removed from the target content to prevent recursive nesting or corrupted link structures.

## Manager and Management Linking

Manager profiles and their integration across company pages follow specific data and linking mandates.

### 1. Data Structure & Conventions

*   **Source Data:** Manager information is stored in `Managers/[Full Name]/Profile.json`.
*   **Source Key Exception:** The list of associated companies in manager profiles is stored under the key `"commpanies"` (double 'm'). This spelling MUST be maintained for data compatibility.
*   **Static API:** The build script (`scripts/build-data.js`) exports processed manager data to `frontend/public/api/managers/[Full Name].json`.

### 2. Linking & Routing

*   **Manager Route:** All links to manager profiles MUST point to `/manager/[Full Name]`.
*   **Management Tabs:** In the "Management" section of company detail pages, manager names MUST be wrapped in anchor tags: `<a href="/manager/[Full Name]">`.
*   **Corporate History:** In manager profile pages, company names MUST link back to their local profiles using the format `/company/TICKER.EXCHANGE`.

### 3. Formatting Rules

*   **Tenure Dates:** All tenure dates displayed in management lists MUST follow the format: `(Date: Year Month)` (e.g., `(Date: 2024 September)`).
*   **Corporate History Details:** In manager lists/profiles, associated companies should display the ticker in brackets without a link, and provide a separate "Website" hyperlink to the external company site.

