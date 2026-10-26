package com.hostelsync.backend.service;

import com.hostelsync.backend.dto.*;
import com.hostelsync.backend.entity.*;
import com.hostelsync.backend.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@Service
public class MessService {

    private final MessMenuRepository messMenuRepository;
    private final MealFeedbackRepository mealFeedbackRepository;
    private final StudentRepository studentRepository;
    private final HostelRepository hostelRepository;
    private final RoomAllocationRepository roomAllocationRepository;

    public MessService(
            MessMenuRepository messMenuRepository,
            MealFeedbackRepository mealFeedbackRepository,
            StudentRepository studentRepository,
            HostelRepository hostelRepository,
            RoomAllocationRepository roomAllocationRepository) {
        this.messMenuRepository = messMenuRepository;
        this.mealFeedbackRepository = mealFeedbackRepository;
        this.studentRepository = studentRepository;
        this.hostelRepository = hostelRepository;
        this.roomAllocationRepository = roomAllocationRepository;
    }

    @Transactional
    public List<MessMenuDto> getWeeklyMenu(Long hostelId) {
        List<MessMenu> list = hostelId != null
                ? messMenuRepository.findByHostelIdOrderByDayOfWeek(hostelId)
                : messMenuRepository.findByHostelIsNullOrderByDayOfWeek();

        if (list.isEmpty()) {
            list = seedDefaultMenu(hostelId);
        }

        return list.stream().map(this::mapMenuToDto).toList();
    }

    @Transactional
    public MessMenuDto updateMenuDay(Long hostelId, DayOfWeek day, MessMenuDto dto) {
        Hostel hostel = (hostelId != null) ? hostelRepository.findById(hostelId).orElse(null) : null;

        MessMenu menu = hostelId != null
                ? messMenuRepository.findByHostelIdAndDayOfWeek(hostelId, day).orElse(new MessMenu())
                : messMenuRepository.findByHostelIsNullAndDayOfWeek(day).orElse(new MessMenu());

        menu.setHostel(hostel);
        menu.setDayOfWeek(day);
        menu.setBreakfast(dto.breakfast());
        menu.setLunch(dto.lunch());
        menu.setSnacks(dto.snacks());
        menu.setDinner(dto.dinner());
        menu.setSpecialNote(dto.specialNote());

        return mapMenuToDto(messMenuRepository.save(menu));
    }

    @Transactional
    public MealFeedbackResponseDto submitFeedback(String studentEmail, MealFeedbackCreateDto dto) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student not found"));

        RoomAllocation alloc = roomAllocationRepository.findActiveByStudentId(student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Student must have active room allocation to rate mess"));

        MealFeedback fb = new MealFeedback();
        fb.setStudent(student);
        fb.setHostel(alloc.getRoom().getHostel());
        fb.setFeedbackDate(LocalDate.now());
        fb.setMealType(dto.mealType());
        fb.setRating(dto.rating());
        fb.setHygieneRating(dto.hygieneRating());
        fb.setComments(dto.comments() != null ? dto.comments().trim() : null);

        MealFeedback saved = mealFeedbackRepository.save(fb);
        return mapFeedbackToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<MealFeedbackResponseDto> getStudentFeedbacks(String studentEmail) {
        return mealFeedbackRepository.findByStudentUserEmailOrderByCreatedAtDesc(studentEmail)
                .stream()
                .map(this::mapFeedbackToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MealFeedbackResponseDto> getHostelFeedbacks(Long hostelId) {
        List<MealFeedback> list = (hostelId != null)
                ? mealFeedbackRepository.findByHostelIdOrderByCreatedAtDesc(hostelId)
                : mealFeedbackRepository.findAll();
        return list.stream().map(this::mapFeedbackToDto).toList();
    }

    @Transactional
    public MessStatsDto getMessSummary(Long hostelId) {
        List<MealFeedback> feedbacks = (hostelId != null)
                ? mealFeedbackRepository.findByHostelIdOrderByCreatedAtDesc(hostelId)
                : mealFeedbackRepository.findAll();

        double avgFood = feedbacks.isEmpty() ? 4.2 : feedbacks.stream().mapToInt(MealFeedback::getRating).average().orElse(4.2);
        double avgHygiene = feedbacks.isEmpty() ? 4.4 : feedbacks.stream().mapToInt(MealFeedback::getHygieneRating).average().orElse(4.4);

        List<MessMenuDto> weekly = getWeeklyMenu(hostelId);
        return new MessStatsDto(
                Math.round(avgFood * 10.0) / 10.0,
                Math.round(avgHygiene * 10.0) / 10.0,
                feedbacks.size(),
                weekly
        );
    }

    private List<MessMenu> seedDefaultMenu(Long hostelId) {
        Hostel hostel = (hostelId != null) ? hostelRepository.findById(hostelId).orElse(null) : null;
        List<MessMenu> defaultList = new ArrayList<>();

        defaultList.add(new MessMenu(hostel, DayOfWeek.MONDAY,
                "Poha with Shev & Lemon, Boiled Eggs / Banana, Tea",
                "Dal Tadka, Mix Veg Curry, Chapati, Steamed Rice, Cucumber Salad",
                "Bread Pakoda with Green Chutney, Tea",
                "Paneer Bhurji / Egg Curry, Plain Dal, Phulka Roti, Jeera Rice",
                "Healthy breakfast start of the week"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.TUESDAY,
                "Upma with Coconut Chutney, Sprouts, Milk / Coffee",
                "Rajma Masala, Aloo Gobi, Roti, Rice, Papad",
                "Biscuits & Ginger Tea",
                "Soyabean Curry, Dal Fry, Roti, Steamed Rice, Sweet Kheer",
                "Special Tuesday Kheer"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.WEDNESDAY,
                "Idli Sambhar with Coconut Chutney, Banana, Tea",
                "Chole Masala, Bhature / Puri, Jeera Rice, Onion Salad",
                "Onion Bhaji with Chutney, Tea",
                "Sev Bhaji (Maharashtrian Style), Dal Tadka, Roti, Rice",
                "Special Regional Curry"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.THURSDAY,
                "Aloo Paratha with Curd & Pickle, Tea",
                "Kadhi Pakoda, Aloo Methi, Chapati, Khichdi, Papad",
                "Cream Roll / Biscuits, Tea",
                "Baingan Bharta, Moong Dal, Roti, Rice",
                "Light digestive Thursday dinner"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.FRIDAY,
                "Misal Pav with Farsan, Boiled Egg / Fruit, Tea",
                "Matar Paneer, Dal Fry, Roti, Peas Pulao, Curd",
                "Veg Cutlet with Tomato Sauce, Tea",
                "Egg Bhurji / Paneer Masala, Dal, Phulka Roti, Rice",
                "Chef special Friday menu"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.SATURDAY,
                "Sabudana Khichdi with Groundnut Chutney, Tea",
                "Chana Dal, Bhendi Masala, Chapati, Steamed Rice, Salad",
                "Samosa with Tamarind Chutney, Tea",
                "Veg Biryani with Raita, Dal Tadka, Papad, Gulab Jamun",
                "Weekend Special Sweet Dinner"));

        defaultList.add(new MessMenu(hostel, DayOfWeek.SUNDAY,
                "Masala Dosa with Sambhar & Chutney, Coffee",
                "Special Sunday Feast: Paneer Tikka Masala / Chicken Curry (Optional), Paratha, Biryani Rice, Ice Cream",
                "Tea & Cookies",
                "Khichdi with Ghee, Kadhi, Papad, Achar",
                "Sunday Feast & Light Evening Dinner"));

        return messMenuRepository.saveAll(defaultList);
    }

    private MessMenuDto mapMenuToDto(MessMenu m) {
        return new MessMenuDto(
                m.getId(),
                m.getHostel() != null ? m.getHostel().getId() : null,
                m.getHostel() != null ? m.getHostel().getName() : "All Hostels",
                m.getDayOfWeek(),
                m.getBreakfast(),
                m.getLunch(),
                m.getSnacks(),
                m.getDinner(),
                m.getSpecialNote(),
                m.getUpdatedAt()
        );
    }

    private MealFeedbackResponseDto mapFeedbackToDto(MealFeedback fb) {
        return new MealFeedbackResponseDto(
                fb.getId(),
                fb.getStudent().getId(),
                fb.getStudent().getUser().getFullName(),
                fb.getStudent().getEnrollmentNumber(),
                fb.getHostel().getId(),
                fb.getHostel().getName(),
                fb.getFeedbackDate(),
                fb.getMealType(),
                fb.getRating(),
                fb.getHygieneRating(),
                fb.getComments(),
                fb.getCreatedAt()
        );
    }
}
