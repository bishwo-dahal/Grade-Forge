package com.grade.forge.search.controller;

import com.grade.forge.gradingassistant.dto.GradingAssistantResponse;
import com.grade.forge.search.service.GASearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/search/grading-assistants")
@RequiredArgsConstructor
public class GASearchController {

	private final GASearchService gaSearchService;

	@GetMapping
	public List<GradingAssistantResponse> search(@RequestParam("keyword") String keyword) {
		return gaSearchService.search(keyword);
	}
}
