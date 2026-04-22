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
