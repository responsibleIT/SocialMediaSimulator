export default class Onboarding {
    constructor() {
        window.addEventListener('DOMContentLoaded', () => {
            if (localStorage) {
                if (!localStorage.getItem('onboardingComplete')) {
                    onboarding1.showModal();
                }

            }
        });

        next1.addEventListener('click', function () {
            onboarding1.close();
            onboarding2.showModal();
        });

        skipOnboarding.addEventListener('click', function () {
            onboarding1.close();
            localStorage.setItem('onboardingComplete', true);
            // Skip the onboarding process
        });

        next2.addEventListener('click', function () {
            onboarding2.close();
            onboarding2.style.display = "none";
            onboarding3.showModal();
            // Proceed to the next step or complete onboarding
        });

        skipOnboarding2.addEventListener('click', function () {
            onboarding2.close();
            localStorage.setItem('onboardingComplete', true);
            onboarding2.style.display = "none";
            // Skip the onboarding process
        });

        next3.addEventListener('click', function () {
            onboarding3.close();
            localStorage.setItem('onboardingComplete', true);
            // Proceed to the next step or complete onboarding
        });
    }
}