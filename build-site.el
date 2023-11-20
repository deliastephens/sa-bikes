;; Set the package installation directory so that packages aren't stored in the
;; ~/.emacs.d/elpa path.
(require 'package)
(setq package-user-dir (expand-file-name "./.packages"))
(setq package-archives '(("melpa" . "https://melpa.org/packages/")
                         ("elpa" . "https://elpa.gnu.org/packages/")))

;; Initialize the package system
(package-initialize)
(unless package-archive-contents
  (package-refresh-contents))

;; Install dependencies
(package-install 'htmlize)

;; Load the publishing system
(require 'ox-publish)

;; Customize the HTML output
(setq org-html-validation-link nil            ;; Don't show validation link
      org-html-head-include-scripts nil       ;; Use our own scripts
      org-html-head-include-default-style nil ;; Use our own styles
      org-html-head "<link rel=\"stylesheet\" href=\"https://cdn.simplecss.org/simple.min.css\" />")


(defun generate-navbar-from-sitemap ()
  "Generate HTML for navbar from sitemap.org."
  (let ((sitemap-file "/home/kali/projects/sa-bikes/sitemap.org")) ;; Adjust the path relative to your project's current directory
    (with-temp-buffer
      (insert-file-contents sitemap-file) ;; Read the sitemap.org content
      (goto-char (point-min))
      (let ((nav-items ""))
        (while (re-search-forward "^- \\[\\[file:\\(.*\\)\\]\\[\\(.*\\)\\]\\]$" nil t)
          (setq nav-items (concat nav-items
                                  (format "<li><a href=\"%s\">%s</a></li>"
                                          (replace-regexp-in-string "\\.org$" ".html" (match-string 1))
                                          (match-string 2))))) ;; Modify links to point to HTML files
        (while (re-search-forward "^- \\(.*\\)$" nil t)
          (setq nav-items (concat nav-items
                                  "<ul>"
                                  (replace-regexp-in-string "\\.org$" ".html" (match-string 1))
                                  "</ul>"))) ;; Handling subpages
        (format "<nav><ul>%s</ul></nav>" nav-items))))) ;; Wrap navigation items with <nav> and <ul> tags

;; Define the publishing project
(setq org-publish-project-alist
      (list
       (list "org-site:main"
             :recursive t
             :base-directory "./content"
             :publishing-function 'org-html-publish-to-html
             :publishing-directory "./public"
             :with-author nil           ;; Don't include author name
             :with-creator t            ;; Include Emacs and Org versions in footer
             :with-toc t                ;; Include a table of contents
             :section-numbers nil       ;; Don't include section numbers
             :time-stamp-file nil
             :auto-sitemap t
             :sitemap-filename "./sitemap.org"
             :html-preamble (lambda (options)
                              (concat "<!DOCTYPE html>"
                                      "<html>"
                                      "<head>"
                                      "<title>Your Title Here</title>"
                                      "</head>"
                                      "<body>"
                                      (generate-navbar-from-sitemap) ;; Include the generated navbar
                                      "<main>")))))    ;; Don't include time stamp in file

;; Generate the site output
(org-publish-all t)

(message "Build complete!")
